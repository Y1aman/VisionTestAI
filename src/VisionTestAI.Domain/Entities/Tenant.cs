namespace VisionTestAI.Domain.Entities;

/// <summary>
/// Represents an isolated workspace (company/team) in the multi-tenant system.
/// </summary>
public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Plan { get; set; } = "free"; // free, starter, professional, business
    public int MaxMonthlyTests { get; set; } = 50;
    public int TestsUsedThisMonth { get; set; }
    public long StorageUsedBytes { get; set; }
    public long MaxStorageBytes { get; set; } = 1_073_741_824; // 1GB default
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public ICollection<AppUser> Users { get; set; } = new List<AppUser>();
    public ICollection<TestRun> TestRuns { get; set; } = new List<TestRun>();
}
