using MediatR;
using VisionTestAI.Application.Common.Models;

namespace VisionTestAI.Application.Tests.Queries.GetTestRuns;

public record GetTestRunsQuery(int Page = 1, int PageSize = 20, string? StatusFilter = null)
    : IRequest<Result<PaginatedList<TestRunDto>>>;
