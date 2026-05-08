using MediatR;
using VisionTestAI.Application.Common.Models;

namespace VisionTestAI.Application.Tests.Commands.CreateTestRun;

/// <summary>
/// Command to create a new test run from a natural language prompt.
/// </summary>
public record CreateTestRunCommand(
    string Prompt,
    string TargetUrl
) : IRequest<Result<TestRunDto>>;
