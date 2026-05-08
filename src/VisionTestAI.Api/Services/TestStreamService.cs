using Microsoft.AspNetCore.SignalR;
using VisionTestAI.Api.Hubs;
using VisionTestAI.Application.Common.Interfaces;

namespace VisionTestAI.Api.Services;

public class TestStreamService : ITestStreamService
{
    private readonly IHubContext<TestStreamHub> _hubContext;

    public TestStreamService(IHubContext<TestStreamHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendFrameAsync(string testRunId, int stepIndex, string base64Image, string description, string status)
    {
        await _hubContext.Clients.Group(testRunId).SendAsync("ReceiveFrame", new { stepIndex, base64Image, description, status });
    }

    public async Task SendStepCompletedAsync(string testRunId, object stepData)
    {
        await _hubContext.Clients.Group(testRunId).SendAsync("StepCompleted", stepData);
    }

    public async Task SendTestCompletedAsync(string testRunId, object testData)
    {
        await _hubContext.Clients.Group(testRunId).SendAsync("TestCompleted", testData);
    }
}
