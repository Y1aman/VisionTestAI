using System.Diagnostics;
using Microsoft.Extensions.Logging;
using Microsoft.Playwright;
using VisionTestAI.Domain.Entities;
using VisionTestAI.Domain.Enums;
using VisionTestAI.Domain.Interfaces;

namespace VisionTestAI.Infrastructure.Services;

public class PlaywrightEngine : IPlaywrightEngine
{
    private readonly ILogger<PlaywrightEngine> _logger;

    public PlaywrightEngine(ILogger<PlaywrightEngine> logger)
    {
        _logger = logger;
    }

    public async Task ExecuteTestAsync(
        TestRun testRun, List<TestStep> steps,
        Func<int, string, string, string, Task> onFrame,
        Func<StepResult, Task> onStepComplete,
        CancellationToken cancellationToken = default)
    {
        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new()
        {
            Headless = true,
            Args = new[]
            {
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-blink-features=AutomationControlled",
                "--disable-extensions",
                "--disable-infobars",
                "--window-size=1280,720",
                "--lang=en-US,en"
            }
        });
        var page = await browser.NewPageAsync(new()
        {
            ViewportSize = new() { Width = 1280, Height = 720 },
            UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            Locale = "en-US",
            TimezoneId = "America/New_York"
        });

        // Remove the webdriver flag to reduce bot detection
        await page.AddInitScriptAsync("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });");

        foreach (var step in steps)
        {
            if (cancellationToken.IsCancellationRequested) break;
            var sw = Stopwatch.StartNew();
            var result = new StepResult
            {
                TestRunId = testRun.Id, StepIndex = step.Order - 1,
                Action = step.Action, Description = step.Description,
                DescriptionAr = step.DescriptionAr, TenantId = testRun.TenantId
            };

            try
            {
                // Capture the URL before the action so we can detect unexpected non-navigation
                var urlBefore = page.Url;

                await ExecuteStepAsync(page, step);

                // ── Post-action error detection for interactive steps ──
                // The action succeeded at the DOM level, but the *application* may have
                // responded with an error (e.g. "incorrect password", validation banner).
                var isInteractive = step.Action is StepAction.Click or StepAction.Fill
                    or StepAction.Navigate or StepAction.Press or StepAction.Select;

                if (isInteractive)
                {
                    // Give the page time to render error states (SPA transitions, toasts, etc.)
                    if (step.Action is StepAction.Click or StepAction.Press)
                        await Task.Delay(PostActionSettleMs, cancellationToken);

                    var pageError = await DetectPageErrorAsync(page);
                    if (pageError is not null)
                    {
                        sw.Stop();
                        result.Status = TestStatus.Failed;
                        result.DurationMs = sw.ElapsedMilliseconds;
                        result.ErrorMessage = pageError;
                        _logger.LogWarning(
                            "Step {Order} ({Action}) succeeded at DOM level but page shows error: {Error}",
                            step.Order, step.Action, pageError);

                        var errorScreenshot = await CaptureFrame(page);
                        result.ScreenshotBase64 = errorScreenshot;
                        await onFrame(step.Order - 1, errorScreenshot, step.Description, "Failed");
                        await onStepComplete(result);
                        continue;
                    }
                }

                sw.Stop();
                result.Status = TestStatus.Passed;
                result.DurationMs = sw.ElapsedMilliseconds;

                var screenshot = await CaptureFrame(page);
                result.ScreenshotBase64 = screenshot;
                await onFrame(step.Order - 1, screenshot, step.Description, "Passed");
            }
            catch (Exception ex)
            {
                sw.Stop();
                result.Status = TestStatus.Failed;
                result.DurationMs = sw.ElapsedMilliseconds;
                result.ErrorMessage = ex.Message;
                _logger.LogWarning(ex, "Step {Order} failed: {Action}", step.Order, step.Action);

                try { result.ScreenshotBase64 = await CaptureFrame(page); } catch { }
                await onFrame(step.Order - 1, result.ScreenshotBase64 ?? "", step.Description, "Failed");
            }

            await onStepComplete(result);
        }
    }

    // Production-safe timeouts: 60s for navigation, 15s for interactions
    private const int NavigationTimeoutMs = 60_000;
    private const int InteractionTimeoutMs = 15_000;
    private const int QuickProbeTimeoutMs = 3_000; // Fast check before trying fallbacks
    private const int ErrorProbeTimeoutMs = 2_000; // How long to wait for error elements after an action
    private const int PostActionSettleMs = 1_500;  // Let the page settle after a click before probing

    // Common fallback selectors when AI-generated selectors don't match the actual DOM
    private static readonly Dictionary<string, string[]> FillSelectorFallbacks = new()
    {
        // Email/username field fallbacks — covers sites like Saucedemo that use #user-name
        ["input[type='email']"] = new[] {
            "input[type='email']", "#email", "input[name='email']",
            "#user-name", "#username", "input[name='username']", "input[name='user-name']",
            "input[type='text']", "[placeholder*='user' i]", "[placeholder*='email' i]",
            "[data-test='username']", "[id*='login' i]"
        },
        ["input[type='password']"] = new[] {
            "input[type='password']", "#password", "input[name='password']",
            "[data-test='password']", "[placeholder*='password' i]"
        },
    };

    private static readonly Dictionary<string, string[]> ClickSelectorFallbacks = new()
    {
        ["button[type='submit']"] = new[] {
            "button[type='submit']", "input[type='submit']",
            "#login-button", ".login-btn", ".btn-login", ".submit-button",
            "[data-test='login-button']", "button:has-text('Login')", "button:has-text('Sign in')",
            "button:has-text('Log in')"
        },
    };

    private async Task ExecuteStepAsync(IPage page, TestStep step)
    {
        switch (step.Action)
        {
            case StepAction.Navigate:
                await page.GotoAsync(step.Value!, new() { WaitUntil = WaitUntilState.DOMContentLoaded, Timeout = NavigationTimeoutMs });
                break;
            case StepAction.Click:
                await ClickWithFallbackAsync(page, step.Selector!);
                break;
            case StepAction.Fill:
                await FillWithFallbackAsync(page, step.Selector!, step.Value ?? "");
                break;
            case StepAction.Select:
                await page.Locator(step.Selector!).First.SelectOptionAsync(step.Value ?? "", new() { Timeout = InteractionTimeoutMs });
                break;
            case StepAction.Assert:
                var el = page.Locator(step.Selector!).First;
                await el.WaitForAsync(new() { Timeout = InteractionTimeoutMs });
                if (!string.IsNullOrEmpty(step.Value))
                {
                    var text = await el.TextContentAsync();
                    if (step.Value.StartsWith("contains:"))
                    {
                        var expected = step.Value["contains:".Length..];
                        if (!text?.Contains(expected, StringComparison.OrdinalIgnoreCase) ?? true)
                            throw new Exception($"Expected text containing '{expected}' but got '{text}'");
                    }
                }
                break;
            case StepAction.Wait:
                if (int.TryParse(step.Value, out var ms))
                    await Task.Delay(Math.Min(ms, 10000));
                break;
            case StepAction.Hover:
                await page.Locator(step.Selector!).First.HoverAsync(new() { Timeout = InteractionTimeoutMs });
                break;
            case StepAction.Scroll:
                var scrollAmount = int.TryParse(step.Value, out var px) ? px : 300;
                await page.EvaluateAsync($"window.scrollBy(0, {scrollAmount})");
                break;
            case StepAction.Press:
                await page.Keyboard.PressAsync(step.Value ?? "Enter");
                break;
            case StepAction.Screenshot:
                break; // Screenshot is always captured after each step
        }
    }

    /// <summary>
    /// Tries the primary selector first (quick probe), then cascades through fallback selectors
    /// for common form fields that sites implement differently.
    /// </summary>
    private async Task FillWithFallbackAsync(IPage page, string selector, string value)
    {
        // If the selector contains multiple comma-separated selectors, try each one first
        var candidates = BuildFallbackList(selector, FillSelectorFallbacks);

        foreach (var candidate in candidates)
        {
            try
            {
                var locator = page.Locator(candidate).First;
                // Quick probe: is this element present?
                await locator.WaitForAsync(new() { Timeout = QuickProbeTimeoutMs, State = WaitForSelectorState.Attached });
                // Found it — fill with the full timeout
                await locator.FillAsync(value, new() { Timeout = InteractionTimeoutMs });
                _logger.LogInformation("Fill succeeded with selector: {Selector}", candidate);
                return;
            }
            catch (TimeoutException)
            {
                _logger.LogDebug("Fill selector not found, trying next: {Selector}", candidate);
            }
        }

        // All fallbacks exhausted — throw with helpful error
        throw new Exception(
            $"Could not find a fillable element. Tried: {string.Join(", ", candidates)}. " +
            $"Original selector: {selector}");
    }

    /// <summary>
    /// Tries the primary selector first (quick probe), then cascades through fallback selectors
    /// for common buttons/links that sites implement differently.
    /// </summary>
    private async Task ClickWithFallbackAsync(IPage page, string selector)
    {
        var candidates = BuildFallbackList(selector, ClickSelectorFallbacks);

        foreach (var candidate in candidates)
        {
            try
            {
                var locator = page.Locator(candidate).First;
                await locator.WaitForAsync(new() { Timeout = QuickProbeTimeoutMs, State = WaitForSelectorState.Attached });
                await locator.ClickAsync(new() { Timeout = InteractionTimeoutMs });
                _logger.LogInformation("Click succeeded with selector: {Selector}", candidate);
                return;
            }
            catch (TimeoutException)
            {
                _logger.LogDebug("Click selector not found, trying next: {Selector}", candidate);
            }
        }

        throw new Exception(
            $"Could not find a clickable element. Tried: {string.Join(", ", candidates)}. " +
            $"Original selector: {selector}");
    }

    /// <summary>
    /// Builds a de-duplicated list of selectors to try:
    /// 1. Each part of the original comma-separated selector
    /// 2. Known fallback selectors if any part matches a known pattern
    /// 3. The original full selector as-is (in case it's a complex combined selector)
    /// </summary>
    private static List<string> BuildFallbackList(string selector, Dictionary<string, string[]> fallbackMap)
    {
        var result = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // Split comma-separated selectors and try each individually first
        var parts = selector.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var part in parts)
        {
            if (seen.Add(part)) result.Add(part);

            // If this part matches a known fallback pattern, add all its fallbacks
            if (fallbackMap.TryGetValue(part, out var fallbacks))
            {
                foreach (var fb in fallbacks)
                    if (seen.Add(fb)) result.Add(fb);
            }
        }

        // Also add the original full selector (for CSS comma-separated matching)
        if (parts.Length > 1 && seen.Add(selector))
            result.Add(selector);

        return result;
    }

    private static async Task<string> CaptureFrame(IPage page)
    {
        var bytes = await page.ScreenshotAsync(new() { Type = ScreenshotType.Jpeg, Quality = 60 });
        return Convert.ToBase64String(bytes);
    }

    // ── Common error indicator selectors (conservative set to minimise false positives) ──
    // Each selector is checked for *visibility* — hidden/display:none elements are ignored.
    private static readonly string[] ErrorSelectors = new[]
    {
        // ARIA / semantic
        "[role='alert']",
        // Common CSS class patterns (case-insensitive attribute selectors)
        "[class*='error-message' i]",
        "[class*='error_message' i]",
        "[class*='errormessage' i]",
        "[class*='alert-danger' i]",
        "[class*='alert-error' i]",
        "[class*='form-error' i]",
        "[class*='field-error' i]",
        "[class*='validation-error' i]",
        "[class*='invalid-feedback' i]",
        "[class*='error-banner' i]",
        "[class*='login-error' i]",
        "[class*='auth-error' i]",
        // Data-test attributes often used in testing-oriented sites (e.g., Saucedemo)
        "[data-test='error']",
        "[data-testid='error']",
        // Common ID patterns
        "#error-message",
        "#login-error",
        "#auth-error",
        // Toast / notification patterns
        ".toast-error",
        ".notification-error",
        ".Toastify__toast--error",
    };

    /// <summary>
    /// Probes the page for visible error indicators after an interactive action.
    /// Returns null if no errors found, or a descriptive error string if one is detected.
    /// Only considers *visible* elements to avoid false positives from hidden templates.
    /// </summary>
    private async Task<string?> DetectPageErrorAsync(IPage page)
    {
        try
        {
            // Build a combined selector for efficiency (single DOM query)
            var combinedSelector = string.Join(", ", ErrorSelectors);
            var errorLocator = page.Locator(combinedSelector);

            // Quick check: are any error elements present in the DOM?
            var count = await errorLocator.CountAsync();
            if (count == 0) return null;

            // Check each matched element for visibility and non-empty text
            for (var i = 0; i < count; i++)
            {
                var element = errorLocator.Nth(i);
                try
                {
                    var isVisible = await element.IsVisibleAsync();
                    if (!isVisible) continue;

                    var text = (await element.TextContentAsync())?.Trim();
                    if (string.IsNullOrWhiteSpace(text)) continue;

                    // Ignore very short text (likely icons or symbols, not real messages)
                    if (text.Length < 5) continue;

                    _logger.LogInformation(
                        "[ErrorDetection] Found visible error indicator: \"{Text}\"", text);

                    // Truncate very long error messages
                    if (text.Length > 300)
                        text = text[..300] + "…";

                    return $"Page error detected: {text}";
                }
                catch
                {
                    // Element may have become stale; skip it
                }
            }

            // Also check for common JavaScript-based error patterns in the page
            // e.g., sites that set error text via JS without semantic markup
            var jsError = await page.EvaluateAsync<string?>(@"() => {
                // Check for elements with 'error' in class that contain visible text
                const els = document.querySelectorAll(
                    '.error:not([style*=""display: none""]):not([hidden]),' +
                    '.errors:not([style*=""display: none""]):not([hidden])'
                );
                for (const el of els) {
                    const style = window.getComputedStyle(el);
                    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
                    const text = el.textContent?.trim();
                    if (text && text.length >= 5 && text.length <= 500) return text;
                }
                return null;
            }");

            if (!string.IsNullOrWhiteSpace(jsError))
            {
                _logger.LogInformation(
                    "[ErrorDetection] Found JS-level error indicator: \"{Text}\"", jsError);
                return $"Page error detected: {jsError}";
            }

            return null;
        }
        catch (Exception ex)
        {
            // Error detection itself should never break the test flow
            _logger.LogDebug(ex, "[ErrorDetection] Error probe failed (non-fatal)");
            return null;
        }
    }
}
