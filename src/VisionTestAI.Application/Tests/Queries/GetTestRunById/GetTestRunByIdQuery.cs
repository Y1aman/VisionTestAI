using MediatR;
using VisionTestAI.Application.Common.Models;

namespace VisionTestAI.Application.Tests.Queries.GetTestRunById;

public record GetTestRunByIdQuery(Guid Id) : IRequest<Result<TestRunDetailDto>>;
