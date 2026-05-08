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
            Headless = true, Args = new[] { "--no-sandbox", "--disable-dev-shm-usage" }
        });
        var page = await browser.NewPageAsync(new() { ViewportSize = new() { Width = 1280, Height = 720 } });

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
                await ExecuteStepAsync(page, step);
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

    private async Task ExecuteStepAsync(IPage page, TestStep step)
    {
        switch (step.Action)
        {
            case StepAction.Navigate:
                await page.GotoAsync(step.Value!, new() { WaitUntil = WaitUntilState.DOMContentLoaded, Timeout = 15000 });
                break;
            case StepAction.Click:
                await page.Locator(step.Selector!).First.ClickAsync(new() { Timeout = 5000 });
                break;
            case StepAction.Fill:
                await page.Locator(step.Selector!).First.FillAsync(step.Value ?? "", new() { Timeout = 5000 });
                break;
            case StepAction.Select:
                await page.Locator(step.Selector!).First.SelectOptionAsync(step.Value ?? "", new() { Timeout = 5000 });
                break;
            case StepAction.Assert:
                var el = page.Locator(step.Selector!).First;
                await el.WaitForAsync(new() { Timeout = 5000 });
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
                    await Task.Delay(Math.Min(ms, 5000));
                break;
            case StepAction.Hover:
                await page.Locator(step.Selector!).First.HoverAsync(new() { Timeout = 5000 });
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

    private static async Task<string> CaptureFrame(IPage page)
    {
        var bytes = await page.ScreenshotAsync(new() { Type = ScreenshotType.Jpeg, Quality = 60 });
        return Convert.ToBase64String(bytes);
    }
}
