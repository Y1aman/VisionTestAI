namespace VisionTestAI.Application.Common.Interfaces;

public interface ITestStreamService
{
    Task SendFrameAsync(string testRunId, int stepIndex, string base64Image, string description, string status);
    Task SendStepCompletedAsync(string testRunId, object stepData);
    Task SendTestCompletedAsync(string testRunId, object testData);
}
