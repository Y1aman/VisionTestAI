using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace VisionTestAI.Api.Hubs;

/// <summary>
/// SignalR Hub for real-time test execution streaming.
/// Clients join a group based on testRunId to receive live updates.
/// </summary>
[Authorize]
public class TestStreamHub : Hub
{
    private readonly ILogger<TestStreamHub> _logger;

    public TestStreamHub(ILogger<TestStreamHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Client joins a test group to receive real-time frames and step results.
    /// </summary>
    public async Task JoinTestGroup(string testRunId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, testRunId);
        _logger.LogInformation("Client {ConnectionId} joined test group {TestRunId}",
            Context.ConnectionId, testRunId);
        await Clients.Caller.SendAsync("JoinedGroup", testRunId);
    }

    /// <summary>
    /// Client leaves a test group.
    /// </summary>
    public async Task LeaveTestGroup(string testRunId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, testRunId);
        _logger.LogInformation("Client {ConnectionId} left test group {TestRunId}",
            Context.ConnectionId, testRunId);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
