using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using VisionTestAI.Domain.Entities;
using VisionTestAI.Domain.Enums;
using VisionTestAI.Domain.Interfaces;

namespace VisionTestAI.Infrastructure.Services;

public class AiService : IAiService
{
    private readonly HttpClient _http;
    private readonly string? _apiKey;
    private readonly ILogger<AiService> _logger;
    private readonly bool _useMock;

    // Shared JSON options with case-insensitive enum converter
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    // Model fallback chain: try each in order if the previous one is rate-limited
    private static readonly string[] ModelFallbackChain =
    [
        "gemini-2.0-flash",
        "gemini-2.5-flash-lite",
        "gemini-3.1-flash-lite"
    ];

    public AiService(IHttpClientFactory factory, IConfiguration config, ILogger<AiService> logger)
    {
        _http = factory.CreateClient("Gemini");
        _apiKey = config["Gemini:ApiKey"];
        _logger = logger;
        _useMock = string.IsNullOrEmpty(_apiKey) || _apiKey == "your-api-key-here";

        // ── Diagnostic logging so mock-mode activation is never silent ──
        if (_useMock)
        {
            _logger.LogWarning(
                "[AiService] ⚠️  MOCK MODE ACTIVE. Gemini API key is missing or placeholder. " +
                "Set the Gemini:ApiKey configuration value (env var Gemini__ApiKey) to a valid key.");
        }
        else
        {
            var masked = _apiKey!.Length > 8
                ? $"{_apiKey[..4]}...{_apiKey[^4..]}"
                : "****";
            _logger.LogInformation("[AiService] ✅ Gemini API key loaded ({MaskedKey}). Live mode enabled.", masked);
        }
    }

    /// <summary>
    /// Calls the Gemini API with model fallback chain and retry logic for rate limits.
    /// Returns the text content from the response, or null if all models fail.
    /// </summary>
    private async Task<string?> CallGeminiAsync(object body, CancellationToken ct)
    {
        foreach (var model in ModelFallbackChain)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={_apiKey}";

            // Retry with backoff for 429 on this model
            var retryDelays = new[] { 2000, 4000 }; // ms — keep it short per model since we have fallbacks
            for (var attempt = 0; attempt <= retryDelays.Length; attempt++)
            {
                var resp = await _http.PostAsJsonAsync(url, body, ct);

                if (resp.IsSuccessStatusCode)
                {
                    var doc = await resp.Content.ReadFromJsonAsync<JsonDocument>(ct);
                    var content = doc?.RootElement.GetProperty("candidates")[0]
                        .GetProperty("content").GetProperty("parts")[0]
                        .GetProperty("text").GetString() ?? "";

                    _logger.LogInformation(
                        "[AiService] ✅ {Model} responded successfully (first 300 chars): {Content}",
                        model, content.Length > 300 ? content[..300] : content);
                    return content;
                }

                var statusCode = (int)resp.StatusCode;

                if (statusCode == 429 && attempt < retryDelays.Length)
                {
                    _logger.LogWarning(
                        "[AiService] ⏳ {Model} returned 429 (rate limit). Retrying in {Delay}ms (attempt {Attempt}/{Max})...",
                        model, retryDelays[attempt], attempt + 1, retryDelays.Length);
                    await Task.Delay(retryDelays[attempt], ct);
                    continue;
                }

                if (statusCode == 429 || statusCode == 503)
                {
                    _logger.LogWarning("[AiService] ⚠️ {Model} exhausted (HTTP {Code}). Trying next model...", model, statusCode);
                    break; // try next model
                }

                // Non-retryable error
                var errorBody = await resp.Content.ReadAsStringAsync(ct);
                _logger.LogError(
                    "[AiService] ❌ {Model} returned HTTP {StatusCode}. Response: {Body}",
                    model, statusCode, errorBody);
                break; // try next model
            }
        }

        _logger.LogError("[AiService] ❌ All Gemini models failed. No AI response available.");
        return null;
    }

    public async Task<List<TestStep>> GenerateTestPlanAsync(string prompt, string targetUrl, CancellationToken ct = default)
    {
        if (_useMock)
        {
            _logger.LogWarning("[AiService] Returning MOCK test plan (API key not configured). Prompt was: {Prompt}", prompt);
            return GenerateMockPlan(prompt, targetUrl);
        }

        var body = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = $"URL: {targetUrl}\nTest: {prompt}" } } }
            },
            systemInstruction = new
            {
                parts = new[] { new { text = "You are a QA expert. Convert natural language to a JSON array of test steps. Each step: {order,action(Navigate/Click/Fill/Assert/Wait/Hover/Scroll/Press/Screenshot),selector,value,description,descriptionAr}. Start with Navigate. Return ONLY a raw valid JSON array, without any markdown formatting or backticks." } }
            },
            generationConfig = new
            {
                temperature = 0.3,
                responseMimeType = "application/json"
            }
        };

        try
        {
            _logger.LogInformation("[AiService] Sending prompt to Gemini API for URL: {Url}", targetUrl);

            var content = await CallGeminiAsync(body, ct);
            if (content is null) return GenerateMockPlan(prompt, targetUrl);

            content = content.Trim();
            content = StripMarkdownCodeBlock(content);

            var steps = JsonSerializer.Deserialize<List<TestStep>>(content, JsonOpts);

            if (steps is null || steps.Count == 0)
            {
                _logger.LogWarning("[AiService] ⚠️ Gemini returned empty/null step list. Falling back to mock.");
                return GenerateMockPlan(prompt, targetUrl);
            }

            // ── Post-processing: fix common AI response issues ──

            // Ensure all Navigate steps have the target URL if their value is empty
            foreach (var step in steps.Where(s => s.Action == StepAction.Navigate))
            {
                if (string.IsNullOrWhiteSpace(step.Value) || !step.Value.StartsWith("http"))
                    step.Value = targetUrl;
            }

            // Ensure first step is always Navigate to the target URL
            if (steps[0].Action != StepAction.Navigate)
            {
                steps.Insert(0, new TestStep
                {
                    Order = 0,
                    Action = StepAction.Navigate,
                    Value = targetUrl,
                    Description = $"Navigate to {targetUrl}",
                    DescriptionAr = $"الانتقال إلى {targetUrl}"
                });
            }

            // Re-number steps sequentially
            for (var i = 0; i < steps.Count; i++)
                steps[i].Order = i + 1;

            _logger.LogInformation("[AiService] ✅ Generated {Count} test steps successfully.", steps.Count);
            return steps;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AiService] ❌ Gemini API request failed with exception. Falling back to mock test plan.");
            return GenerateMockPlan(prompt, targetUrl);
        }
    }

    public async Task<(string, string, string?, string?)> AnalyzeResultsAsync(List<StepResult> results, string prompt, CancellationToken ct = default)
    {
        var passed = results.Count(r => r.Status == TestStatus.Passed);
        var failed = results.Count(r => r.Status == TestStatus.Failed);
        var total = results.Count;
        var summaryEn = $"Test completed: {passed}/{total} steps passed, {failed} failed.";
        var summaryAr = $"اكتمل الاختبار: نجح {passed}/{total} خطوة، فشل {failed}.";
        string? failEn = null, failAr = null;
        
        if (failed > 0)
        {
            var fs = results.Where(r => r.Status == TestStatus.Failed);
            failEn = "Failed: " + string.Join("; ", fs.Select(s => $"Step {s.StepIndex+1} ({s.Description}): {s.ErrorMessage}"));
            failAr = "فشل: " + string.Join("؛ ", fs.Select(s => $"الخطوة {s.StepIndex+1} ({s.DescriptionAr}): {s.ErrorMessage}"));
        }

        if (!_useMock)
        {
            try
            {
                var stepsJson = JsonSerializer.Serialize(results.Select(r => new { step = r.StepIndex+1, r.Description, status = r.Status.ToString(), error = r.ErrorMessage }));
                var body = new
                {
                    contents = new[]
                    {
                        new { parts = new[] { new { text = $"Test: {prompt}\nResults: {stepsJson}" } } }
                    },
                    systemInstruction = new
                    {
                        parts = new[] { new { text = "Analyze test results. Return ONLY raw JSON: {summaryEn,summaryAr,failureEn,failureAr}. Use simple business language. Do not use markdown backticks." } }
                    },
                    generationConfig = new
                    {
                        temperature = 0.5,
                        responseMimeType = "application/json"
                    }
                };

                var c = await CallGeminiAsync(body, ct);
                if (c is not null)
                {
                    c = c.Trim();
                    c = StripMarkdownCodeBlock(c);
                    
                    var a = JsonSerializer.Deserialize<JsonDocument>(c);
                    if (a is not null) 
                        return (
                            a.RootElement.GetProperty("summaryEn").GetString() ?? "", 
                            a.RootElement.GetProperty("summaryAr").GetString() ?? "",
                            a.RootElement.TryGetProperty("failureEn", out var fe) ? fe.GetString() : null, 
                            a.RootElement.TryGetProperty("failureAr", out var fa) ? fa.GetString() : null
                        );
                }
            }
            catch (Exception ex) { _logger.LogError(ex, "AI analysis failed"); }
        }
        return (summaryEn, summaryAr, failEn, failAr);
    }

    private static List<TestStep> GenerateMockPlan(string prompt, string url)
    {
        var p = prompt.ToLowerInvariant();
        var steps = new List<TestStep> { new() { Order = 1, Action = StepAction.Navigate, Value = url, Description = $"Navigate to {url}", DescriptionAr = $"الانتقال إلى {url}" } };
        if (p.Contains("login") || p.Contains("دخول") || p.Contains("تسجيل"))
        {
            steps.Add(new() { Order = 2, Action = StepAction.Wait, Value = "1000", Description = "Wait for page load", DescriptionAr = "انتظار تحميل الصفحة" });
            steps.Add(new() { Order = 3, Action = StepAction.Fill, Selector = "input[type='email'],input[name='email'],#email", Value = "test@example.com", Description = "Enter email", DescriptionAr = "إدخال البريد الإلكتروني" });
            steps.Add(new() { Order = 4, Action = StepAction.Fill, Selector = "input[type='password'],input[name='password'],#password", Value = "wrongpass123", Description = "Enter password", DescriptionAr = "إدخال كلمة المرور" });
            steps.Add(new() { Order = 5, Action = StepAction.Click, Selector = "button[type='submit'],input[type='submit'],.login-btn", Description = "Click login", DescriptionAr = "النقر على تسجيل الدخول" });
            steps.Add(new() { Order = 6, Action = StepAction.Wait, Value = "2000", Description = "Wait for response", DescriptionAr = "انتظار الاستجابة" });
            steps.Add(new() { Order = 7, Action = StepAction.Screenshot, Description = "Capture result", DescriptionAr = "التقاط النتيجة" });
        }
        else
        {
            steps.Add(new() { Order = 2, Action = StepAction.Wait, Value = "2000", Description = "Wait for full load", DescriptionAr = "انتظار التحميل الكامل" });
            steps.Add(new() { Order = 3, Action = StepAction.Screenshot, Description = "Capture page", DescriptionAr = "التقاط الصفحة" });
            steps.Add(new() { Order = 4, Action = StepAction.Scroll, Value = "500", Description = "Scroll down", DescriptionAr = "التمرير لأسفل" });
            steps.Add(new() { Order = 5, Action = StepAction.Screenshot, Description = "Capture scrolled state", DescriptionAr = "التقاط بعد التمرير" });
        }
        return steps;
    }

    private static string StripMarkdownCodeBlock(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return input;
        var trimmed = input.Trim();
        if (trimmed.StartsWith("```"))
        {
            // Remove opening line (e.g. ```json, ```JSON, ```)
            var firstNewline = trimmed.IndexOf('\n');
            if (firstNewline >= 0)
                trimmed = trimmed[(firstNewline + 1)..];
            // Remove closing ```
            if (trimmed.TrimEnd().EndsWith("```"))
                trimmed = trimmed.TrimEnd()[..^3];
            trimmed = trimmed.Trim();
        }
        return trimmed;
    }
}
