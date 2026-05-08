using MediatR;
using VisionTestAI.Application.Common.Models;
using VisionTestAI.Domain.Interfaces;

namespace VisionTestAI.Application.Tests.Queries.GetTestRuns;

public class GetTestRunsHandler : IRequestHandler<GetTestRunsQuery, Result<PaginatedList<TestRunDto>>>
{
    private readonly ITestRunRepository _repository;
    private readonly ITenantContext _tenantContext;

    public GetTestRunsHandler(ITestRunRepository repository, ITenantContext tenantContext)
    {
        _repository = repository;
        _tenantContext = tenantContext;
    }

    public async Task<Result<PaginatedList<TestRunDto>>> Handle(GetTestRunsQuery request, CancellationToken cancellationToken)
    {
        var (items, totalCount) = await _repository.GetPagedAsync(
            _tenantContext.TenantId, request.Page, request.PageSize, request.StatusFilter, cancellationToken);

        var dtos = items.Select(t => new TestRunDto(
            t.Id, t.Prompt, t.TargetUrl, t.Status.ToString(),
            t.CreatedAt, t.StartedAt, t.CompletedAt, t.DurationMs,
            t.StepResults?.Count ?? 0,
            t.StepResults?.Count(s => s.Status == Domain.Enums.TestStatus.Passed) ?? 0,
            t.StepResults?.Count(s => s.Status == Domain.Enums.TestStatus.Failed) ?? 0,
            t.ErrorMessage
        )).ToList();

        return Result<PaginatedList<TestRunDto>>.Success(new PaginatedList<TestRunDto>
        {
            Items = dtos,
            PageIndex = request.Page,
            PageSize = request.PageSize,
            TotalCount = totalCount
        });
    }
}
