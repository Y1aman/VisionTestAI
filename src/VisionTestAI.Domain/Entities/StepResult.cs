using VisionTestAI.Domain.Enums;

namespace VisionTestAI.Domain.Entities;

/// <summary>
/// Records the outcome of executing a single test step.
/// </summary>
public class StepResult : BaseEntity
{
    public Guid TestRunId { get; set; }
    public int StepIndex { get; set; }
    public StepAction Action { get; set; }
    public string Description { get; set; } = string.Empty;
    public string DescriptionAr { get; set; } = string.Empty;
    public TestStatus Status { get; set; } = TestStatus.Pending;
    public string? ScreenshotBase64 { get; set; }
    public string? ErrorMessage { get; set; }
    public long DurationMs { get; set; }
    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public TestRun TestRun { get; set; } = null!;
}
