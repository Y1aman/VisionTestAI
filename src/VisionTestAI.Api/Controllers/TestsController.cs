using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VisionTestAI.Application.Tests.Commands.CreateTestRun;
using VisionTestAI.Application.Tests.Queries.GetTestRunById;
using VisionTestAI.Application.Tests.Queries.GetTestRuns;

namespace VisionTestAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TestsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TestsController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// Create a new test run from a natural language prompt.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTestRunCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return result.IsSuccess
            ? StatusCode(202, result.Data) // 202 Accepted — test queued
            : StatusCode(result.StatusCode, new { result.Error, result.ErrorAr });
    }

    /// <summary>
    /// Get paginated list of test runs for the current tenant.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetTestRunsQuery(page, pageSize, status), ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { result.Error });
    }

    /// <summary>
    /// Get a single test run with full step results and report.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetTestRunByIdQuery(id), ct);
        return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { result.Error, result.ErrorAr });
    }
}
