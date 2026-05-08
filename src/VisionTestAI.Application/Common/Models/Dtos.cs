using VisionTestAI.Domain.Enums;

namespace VisionTestAI.Application.Common.Models;

// ─── Test DTOs ───────────────────────────────────────

public record TestRunDto(
    Guid Id,
    string Prompt,
    string TargetUrl,
    string Status,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    long DurationMs,
    int TotalSteps,
    int PassedSteps,
    int FailedSteps,
    string? ErrorMessage
);

public record TestRunDetailDto(
    Guid Id,
    string Prompt,
    string TargetUrl,
    string? TestPlanJson,
    string Status,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    long DurationMs,
    string? ErrorMessage,
    List<StepResultDto> StepResults,
    TestReportDto? Report
);

public record StepResultDto(
    Guid Id,
    int StepIndex,
    string Action,
    string Description,
    string DescriptionAr,
    string Status,
    string? ScreenshotBase64,
    string? ErrorMessage,
    long DurationMs,
    DateTime ExecutedAt
);

public record TestReportDto(
    Guid Id,
    int TotalSteps,
    int PassedSteps,
    int FailedSteps,
    int SkippedSteps,
    long DurationMs,
    string AiSummary,
    string AiSummaryAr,
    string? AiFailureAnalysis,
    string? AiFailureAnalysisAr
);

public record TestPlanStepDto(
    int Order,
    string Action,
    string? Selector,
    string? Value,
    string Description,
    string DescriptionAr
);

// ─── Auth DTOs ───────────────────────────────────────

public record AuthResponseDto(
    string Token,
    string RefreshToken,
    DateTime Expiration,
    UserDto User
);

public record UserDto(
    string Id,
    string Email,
    string FullName,
    string Role,
    Guid TenantId,
    string TenantName,
    string PreferredLanguage
);

public record LoginDto(string Email, string Password);
public record RegisterDto(string Email, string Password, string FullName, string TenantName, string PreferredLanguage);
public record RefreshTokenDto(string Token, string RefreshToken);

// ─── Dashboard DTOs ──────────────────────────────────

public record DashboardStatsDto(
    int TotalTests,
    int TestsThisMonth,
    int PassedTests,
    int FailedTests,
    double PassRate,
    int MonthlyQuota,
    int MonthlyUsed
);
