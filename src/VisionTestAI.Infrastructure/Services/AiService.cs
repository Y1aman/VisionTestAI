using System.Net.Http.Json;
using System.Text.Json;
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

    public AiService(IHttpClientFactory factory, IConfiguration config, ILogger<AiService> logger)
    {
        _http = factory.CreateClient("Gemini");
        _apiKey = config["Gemini:ApiKey"];
        _logger = logger;
        _useMock = string.IsNullOrEmpty(_apiKey) || _apiKey == "your-api-key-here";
    }

    public async Task<List<TestStep>> GenerateTestPlanAsync(string prompt, string targetUrl, CancellationToken ct = default)
    {
        if (_useMock) return GenerateMockPlan(prompt, targetUrl);

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
            var resp = await _http.PostAsJsonAsync($"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={_apiKey}", body, ct);
            resp.EnsureSuccessStatusCode();
            var doc = await resp.Content.ReadFromJsonAsync<JsonDocument>(ct);
            
            var content = doc?.RootElement.GetProperty("candidates")[0]
                .GetProperty("content").GetProperty("parts")[0]
                .GetProperty("text").GetString() ?? "";
                
            content = content.Trim();
            if (content.StartsWith("```")) { var s = content.IndexOf('['); var e = content.LastIndexOf(']'); if (s >= 0 && e > s) content = content[s..(e+1)]; }
            
            return JsonSerializer.Deserialize<List<TestStep>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? GenerateMockPlan(prompt, targetUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini API request failed (e.g., Rate Limit/Quota). Falling back to mock test plan.");
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

                var resp = await _http.PostAsJsonAsync($"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={_apiKey}", body, ct);
                resp.EnsureSuccessStatusCode();
                var doc = await resp.Content.ReadFromJsonAsync<JsonDocument>(ct);
                
                var c = doc?.RootElement.GetProperty("candidates")[0]
                    .GetProperty("content").GetProperty("parts")[0]
                    .GetProperty("text").GetString() ?? "";
                    
                c = c.Trim(); 
                if (c.StartsWith("```")) { var s = c.IndexOf('{'); var e = c.LastIndexOf('}'); if (s >= 0 && e > s) c = c[s..(e+1)]; }
                
                var a = JsonSerializer.Deserialize<JsonDocument>(c);
                if (a is not null) 
                    return (
                        a.RootElement.GetProperty("summaryEn").GetString() ?? "", 
                        a.RootElement.GetProperty("summaryAr").GetString() ?? "",
                        a.RootElement.TryGetProperty("failureEn", out var fe) ? fe.GetString() : null, 
                        a.RootElement.TryGetProperty("failureAr", out var fa) ? fa.GetString() : null
                    );
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
}
