using VisionTestAI.Domain.Entities;

namespace VisionTestAI.Domain.Interfaces;

/// <summary>
/// Repository for TestRun aggregate root operations.
/// </summary>
public interface ITestRunRepository
{
    Task<TestRun?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<TestRun?> GetByIdWithResultsAsync(Guid id, CancellationToken ct = default);
    Task<(IReadOnlyList<TestRun> Items, int TotalCount)> GetPagedAsync(
        Guid tenantId, int page, int pageSize, string? statusFilter = null, CancellationToken ct = default);
    Task<TestRun> AddAsync(TestRun testRun, CancellationToken ct = default);
    Task UpdateAsync(TestRun testRun, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<int> GetMonthlyTestCountAsync(Guid tenantId, CancellationToken ct = default);
}
