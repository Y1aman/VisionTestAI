using MediatR;
using VisionTestAI.Application.Common.Models;
using VisionTestAI.Domain.Interfaces;

namespace VisionTestAI.Application.Tests.Queries.GetTestRunById;

public class GetTestRunByIdHandler : IRequestHandler<GetTestRunByIdQuery, Result<TestRunDetailDto>>
{
    private readonly ITestRunRepository _repository;

    public GetTestRunByIdHandler(ITestRunRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<TestRunDetailDto>> Handle(GetTestRunByIdQuery request, CancellationToken cancellationToken)
    {
        var testRun = await _repository.GetByIdWithResultsAsync(request.Id, cancellationToken);
        if (testRun is null)
            return Result<TestRunDetailDto>.Failure("Test run not found", "لم يتم العثور على الاختبار", 404);

        var stepDtos = testRun.StepResults.OrderBy(s => s.StepIndex).Select(s => new StepResultDto(
            s.Id, s.StepIndex, s.Action.ToString(), s.Description, s.DescriptionAr,
            s.Status.ToString(), s.ScreenshotBase64, s.ErrorMessage, s.DurationMs, s.ExecutedAt
        )).ToList();

        TestReportDto? reportDto = null;
        if (testRun.Report is not null)
        {
            reportDto = new TestReportDto(
                testRun.Report.Id, testRun.Report.TotalSteps,
                testRun.Report.PassedSteps, testRun.Report.FailedSteps, testRun.Report.SkippedSteps,
                testRun.Report.DurationMs, testRun.Report.AiSummary, testRun.Report.AiSummaryAr,
                testRun.Report.AiFailureAnalysis, testRun.Report.AiFailureAnalysisAr
            );
        }

        return Result<TestRunDetailDto>.Success(new TestRunDetailDto(
            testRun.Id, testRun.Prompt, testRun.TargetUrl, testRun.TestPlanJson,
            testRun.Status.ToString(), testRun.CreatedAt, testRun.StartedAt, testRun.CompletedAt,
            testRun.DurationMs, testRun.ErrorMessage, stepDtos, reportDto
        ));
    }
}
