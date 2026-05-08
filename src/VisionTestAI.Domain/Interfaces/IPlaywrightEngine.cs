using VisionTestAI.Domain.Entities;

namespace VisionTestAI.Domain.Interfaces;

/// <summary>
/// Playwright browser automation engine for executing test plans.
/// </summary>
public interface IPlaywrightEngine
{
    /// <summary>
    /// Executes a test run's steps in a headless browser, broadcasting frames and results via callbacks.
    /// </summary>
    Task ExecuteTestAsync(
        TestRun testRun,
        List<TestStep> steps,
        Func<int, string, string, string, Task> onFrame,   // stepIndex, base64Image, description, status
        Func<StepResult, Task> onStepComplete,
        CancellationToken cancellationToken = default);
}
