using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VisionTestAI.Domain.Entities;
using VisionTestAI.Domain.Interfaces;

namespace VisionTestAI.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    private readonly ITenantContext? _tenantContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext? tenantContext = null)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<TestRun> TestRuns => Set<TestRun>();
    public DbSet<StepResult> StepResults => Set<StepResult>();
    public DbSet<TestReport> TestReports => Set<TestReport>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ─── Tenant ───
        builder.Entity<Tenant>(e =>
        {
            e.HasKey(t => t.Id);
            e.HasIndex(t => t.Slug).IsUnique();
            e.Property(t => t.Name).HasMaxLength(200).IsRequired();
            e.Property(t => t.Slug).HasMaxLength(100).IsRequired();
            e.Property(t => t.Plan).HasMaxLength(50).HasDefaultValue("free");
        });

        // ─── AppUser ───
        builder.Entity<AppUser>(e =>
        {
            e.Property(u => u.FullName).HasMaxLength(200);
            e.Property(u => u.PreferredLanguage).HasMaxLength(5).HasDefaultValue("en");
            e.HasOne(u => u.Tenant).WithMany(t => t.Users).HasForeignKey(u => u.TenantId);
            e.HasIndex(u => u.TenantId);
        });

        // ─── TestRun ───
        builder.Entity<TestRun>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Prompt).HasMaxLength(2000).IsRequired();
            e.Property(t => t.TargetUrl).HasMaxLength(2048).IsRequired();
            e.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(t => t.Tenant).WithMany(tn => tn.TestRuns).HasForeignKey(t => t.TenantId);
            e.HasIndex(t => t.TenantId);
            e.HasIndex(t => t.Status);
            e.HasIndex(t => t.CreatedAt);
        });

        // ─── StepResult ───
        builder.Entity<StepResult>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.Action).HasConversion<string>().HasMaxLength(20);
            e.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(s => s.Description).HasMaxLength(500);
            e.Property(s => s.DescriptionAr).HasMaxLength(500);
            e.HasOne(s => s.TestRun).WithMany(t => t.StepResults).HasForeignKey(s => s.TestRunId);
            e.HasIndex(s => s.TestRunId);
        });

        // ─── TestReport ───
        builder.Entity<TestReport>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasOne(r => r.TestRun).WithOne(t => t.Report).HasForeignKey<TestReport>(r => r.TestRunId);
            e.HasIndex(r => r.TestRunId).IsUnique();
        });

        // ─── Global Query Filters for Multi-Tenancy ───
        if (_tenantContext is not null)
        {
            builder.Entity<TestRun>().HasQueryFilter(e => e.TenantId == _tenantContext.TenantId);
            builder.Entity<StepResult>().HasQueryFilter(e => e.TenantId == _tenantContext.TenantId);
            builder.Entity<TestReport>().HasQueryFilter(e => e.TenantId == _tenantContext.TenantId);
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    if (_tenantContext is not null && entry.Entity.TenantId == Guid.Empty)
                        entry.Entity.TenantId = _tenantContext.TenantId;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
