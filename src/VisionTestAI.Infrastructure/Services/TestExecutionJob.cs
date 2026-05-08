using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using VisionTestAI.Application.Tests.Commands.CreateTestRun;
using VisionTestAI.Domain.Entities;
using VisionTestAI.Domain.Enums;
using VisionTestAI.Domain.Interfaces;
using VisionTestAI.Infrastructure.Data;

namespace VisionTestAI.Infrastructure.Services;

/// <summary>
/// Hangfire background job for executing Playwright tests with live SignalR streaming.
/// </summary>
public class TestExecutionJob : ITestExecutionJob
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TestExecutionJob> _logger;

    public TestExecutionJob(IServiceScopeFactory scopeFactory, ILogger<TestExecutionJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid testRunId, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var playwrightEngine = scope.ServiceProvider.GetRequiredService<IPlaywrightEngine>();
        var aiService = scope.ServiceProvider.GetRequiredService<IAiService>();

        // Use the proper interface to communicate with SignalR without reflection
        var streamService = scope.ServiceProvider.GetService<VisionTestAI.Application.Common.Interfaces.ITestStreamService>();

        // Background jobs don't have an HTTP context, so ITenantContext returns Guid.Empty.
        // We must bypass query filters to find the test run.
        var testRun = await db.TestRuns.IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == testRunId, cancellationToken);
            
        if (testRun is null)
        {
            _logger.LogError("TestRun {Id} not found", testRunId);
            return;
        }

        testRun.Status = TestStatus.Running;
        testRun.StartedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var steps = new List<TestStep>();
        if (!string.IsNullOrEmpty(testRun.TestPlanJson))
        {
            steps = JsonSerializer.Deserialize<List<TestStep>>(testRun.TestPlanJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        }

        var stepResults = new List<StepResult>();
        var groupName = testRunId.ToString();

        try
        {
            await playwrightEngine.ExecuteTestAsync(
                testRun, steps,
                onFrame: async (stepIndex, base64, description, status) =>
                {
                    if (streamService is not null)
                    {
                        await streamService.SendFrameAsync(groupName, stepIndex, base64, description, status);
                    }
                },
                onStepComplete: async (result) =>
                {
                    stepResults.Add(result);
                    db.StepResults.Add(result);
                    await db.SaveChangesAsync(cancellationToken);

                    if (streamService is not null)
                    {
                        await streamService.SendStepCompletedAsync(groupName, new
                        {
                            stepIndex = result.StepIndex,
                            passed = result.Status == TestStatus.Passed,
                            description = result.Description,
                            descriptionAr = result.DescriptionAr,
                            errorMessage = result.ErrorMessage,
                            durationMs = result.DurationMs
                        });
                    }
                },
                cancellationToken);

            var hasFailures = stepResults.Any(r => r.Status == TestStatus.Failed);
            testRun.Status = hasFailures ? TestStatus.Failed : TestStatus.Passed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test execution failed for {Id}", testRunId);
            testRun.Status = TestStatus.Error;
            testRun.ErrorMessage = ex.Message;
        }

        testRun.CompletedAt = DateTime.UtcNow;
        testRun.DurationMs = (long)(testRun.CompletedAt.Value - testRun.StartedAt!.Value).TotalMilliseconds;

        // Generate AI report
        var (summaryEn, summaryAr, failureEn, failureAr) =
            await aiService.AnalyzeResultsAsync(stepResults, testRun.Prompt, cancellationToken);

        var report = new TestReport
        {
            TestRunId = testRunId, TenantId = testRun.TenantId,
            TotalSteps = stepResults.Count,
            PassedSteps = stepResults.Count(r => r.Status == TestStatus.Passed),
            FailedSteps = stepResults.Count(r => r.Status == TestStatus.Failed),
            SkippedSteps = stepResults.Count(r => r.Status == TestStatus.Cancelled),
            DurationMs = testRun.DurationMs,
            AiSummary = summaryEn, AiSummaryAr = summaryAr,
            AiFailureAnalysis = failureEn, AiFailureAnalysisAr = failureAr
        };

        db.TestReports.Add(report);
        await db.SaveChangesAsync(cancellationToken);

        if (streamService is not null)
        {
            await streamService.SendTestCompletedAsync(groupName, new
            {
                testRunId, status = testRun.Status.ToString(),
                summaryEn, summaryAr, failureEn, failureAr,
                totalSteps = report.TotalSteps,
                passedSteps = report.PassedSteps,
                failedSteps = report.FailedSteps,
                durationMs = report.DurationMs
            });
        }
    }
}
