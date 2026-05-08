using Microsoft.EntityFrameworkCore;
using VisionTestAI.Domain.Entities;
using VisionTestAI.Domain.Interfaces;
using VisionTestAI.Infrastructure.Data;

namespace VisionTestAI.Infrastructure.Repositories;

public class TestRunRepository : ITestRunRepository
{
    private readonly AppDbContext _db;

    public TestRunRepository(AppDbContext db) => _db = db;

    public async Task<TestRun?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.TestRuns.FindAsync(new object[] { id }, ct);

    public async Task<TestRun?> GetByIdWithResultsAsync(Guid id, CancellationToken ct = default)
        => await _db.TestRuns
            .Include(t => t.StepResults.OrderBy(s => s.StepIndex))
            .Include(t => t.Report)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<(IReadOnlyList<TestRun> Items, int TotalCount)> GetPagedAsync(
        Guid tenantId, int page, int pageSize, string? statusFilter = null, CancellationToken ct = default)
    {
        var query = _db.TestRuns
            .Include(t => t.StepResults)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statusFilter))
        {
            if (Enum.TryParse<Domain.Enums.TestStatus>(statusFilter, true, out var status))
                query = query.Where(t => t.Status == status);
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<TestRun> AddAsync(TestRun testRun, CancellationToken ct = default)
    {
        _db.TestRuns.Add(testRun);
        await _db.SaveChangesAsync(ct);
        return testRun;
    }

    public async Task UpdateAsync(TestRun testRun, CancellationToken ct = default)
    {
        _db.TestRuns.Update(testRun);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.TestRuns.FindAsync(new object[] { id }, ct);
        if (entity is not null)
        {
            _db.TestRuns.Remove(entity);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<int> GetMonthlyTestCountAsync(Guid tenantId, CancellationToken ct = default)
    {
        var firstOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        return await _db.TestRuns
            .IgnoreQueryFilters()
            .CountAsync(t => t.TenantId == tenantId && t.CreatedAt >= firstOfMonth, ct);
    }
}
