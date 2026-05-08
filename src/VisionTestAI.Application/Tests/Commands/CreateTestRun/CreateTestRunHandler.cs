using System.Text.Json;
using Hangfire;
using MediatR;
using VisionTestAI.Application.Common.Models;
using VisionTestAI.Domain.Entities;
using VisionTestAI.Domain.Enums;
using VisionTestAI.Domain.Interfaces;

namespace VisionTestAI.Application.Tests.Commands.CreateTestRun;

public class CreateTestRunHandler : IRequestHandler<CreateTestRunCommand, Result<TestRunDto>>
{
    private readonly IAiService _aiService;
    private readonly ITestRunRepository _repository;
    private readonly ITenantContext _tenantContext;
    private readonly IBackgroundJobClient _backgroundJobClient;

    public CreateTestRunHandler(
        IAiService aiService,
        ITestRunRepository repository,
        ITenantContext tenantContext,
        IBackgroundJobClient backgroundJobClient)
    {
        _aiService = aiService;
        _repository = repository;
        _tenantContext = tenantContext;
        _backgroundJobClient = backgroundJobClient;
    }

    public async Task<Result<TestRunDto>> Handle(CreateTestRunCommand request, CancellationToken cancellationToken)
    {
        // Check monthly quota
        var monthlyCount = await _repository.GetMonthlyTestCountAsync(_tenantContext.TenantId, cancellationToken);
        // For now, allow unlimited tests (quota checked in middleware later)

        // Generate test plan using AI
        var steps = await _aiService.GenerateTestPlanAsync(request.Prompt, request.TargetUrl, cancellationToken);

        // Create test run entity
        var testRun = new TestRun
        {
            Prompt = request.Prompt,
            TargetUrl = request.TargetUrl,
            TestPlanJson = JsonSerializer.Serialize(steps),
            Status = TestStatus.Queued,
            TenantId = _tenantContext.TenantId
        };

        await _repository.AddAsync(testRun, cancellationToken);

        // Enqueue background job for execution
        _backgroundJobClient.Enqueue<ITestExecutionJob>(
            job => job.ExecuteAsync(testRun.Id, CancellationToken.None));

        return Result<TestRunDto>.Success(new TestRunDto(
            testRun.Id,
            testRun.Prompt,
            testRun.TargetUrl,
            testRun.Status.ToString(),
            testRun.CreatedAt,
            testRun.StartedAt,
            testRun.CompletedAt,
            testRun.DurationMs,
            steps.Count,
            0, 0,
            testRun.ErrorMessage
        ));
    }
}

/// <summary>
/// Interface for the Hangfire test execution job.
/// </summary>
public interface ITestExecutionJob
{
    Task ExecuteAsync(Guid testRunId, CancellationToken cancellationToken);
}
