namespace VisionTestAI.Domain.Entities;

/// <summary>
/// AI-generated human-readable test report with failure analysis.
/// </summary>
public class TestReport : BaseEntity
{
    public Guid TestRunId { get; set; }
    public int TotalSteps { get; set; }
    public int PassedSteps { get; set; }
    public int FailedSteps { get; set; }
    public int SkippedSteps { get; set; }
    public long DurationMs { get; set; }
    
    /// <summary>
    /// AI-generated summary of the test results in English.
    /// </summary>
    public string AiSummary { get; set; } = string.Empty;

    /// <summary>
    /// AI-generated summary of the test results in Arabic.
    /// </summary>
    public string AiSummaryAr { get; set; } = string.Empty;

    /// <summary>
    /// Detailed AI explanation of what went wrong (English), for failed tests only.
    /// </summary>
    public string? AiFailureAnalysis { get; set; }

    /// <summary>
    /// Detailed AI explanation of what went wrong (Arabic), for failed tests only.
    /// </summary>
    public string? AiFailureAnalysisAr { get; set; }

    // Navigation
    public TestRun TestRun { get; set; } = null!;
}
