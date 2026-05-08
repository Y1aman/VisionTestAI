using VisionTestAI.Domain.Enums;

namespace VisionTestAI.Domain.Entities;

/// <summary>
/// Represents a single test execution lifecycle — from natural language prompt to final report.
/// </summary>
public class TestRun : BaseEntity
{
    public string Prompt { get; set; } = string.Empty;
    public string TargetUrl { get; set; } = string.Empty;
    public string? TestPlanJson { get; set; }
    public string? GeneratedScript { get; set; }
    public TestStatus Status { get; set; } = TestStatus.Pending;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public long DurationMs { get; set; }
    public string? ErrorMessage { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public ICollection<StepResult> StepResults { get; set; } = new List<StepResult>();
    public TestReport? Report { get; set; }
}
