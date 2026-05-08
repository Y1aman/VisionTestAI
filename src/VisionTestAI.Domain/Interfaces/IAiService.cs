using VisionTestAI.Domain.Entities;

namespace VisionTestAI.Domain.Interfaces;

/// <summary>
/// AI service for converting natural language to test plans and analyzing failures.
/// </summary>
public interface IAiService
{
    /// <summary>
    /// Converts a natural language test description into a structured test plan.
    /// </summary>
    Task<List<TestStep>> GenerateTestPlanAsync(string prompt, string targetUrl, CancellationToken ct = default);

    /// <summary>
    /// Analyzes failed test results and produces a human-readable explanation in both English and Arabic.
    /// </summary>
    Task<(string SummaryEn, string SummaryAr, string? FailureEn, string? FailureAr)> AnalyzeResultsAsync(
        List<StepResult> results, string originalPrompt, CancellationToken ct = default);
}
