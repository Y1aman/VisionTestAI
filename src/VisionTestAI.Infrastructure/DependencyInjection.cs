using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VisionTestAI.Application.Common.Interfaces;
using VisionTestAI.Application.Tests.Commands.CreateTestRun;
using VisionTestAI.Domain.Entities;
using VisionTestAI.Domain.Interfaces;
using VisionTestAI.Infrastructure.Data;
using VisionTestAI.Infrastructure.Identity;
using VisionTestAI.Infrastructure.Repositories;
using VisionTestAI.Infrastructure.Services;

namespace VisionTestAI.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // Database
        var connectionString = config.GetConnectionString("DefaultConnection")!;
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString,
                b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        // Identity
        services.AddIdentity<AppUser, IdentityRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 6;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = false;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        // Services
        services.AddScoped<ITenantContext, TenantContext>();
        services.AddScoped<ITestRunRepository, TestRunRepository>();
        services.AddScoped<IAiService, AiService>();
        services.AddScoped<IPlaywrightEngine, PlaywrightEngine>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<ITestExecutionJob, TestExecutionJob>();

        // HTTP Client for Gemini
        services.AddHttpClient("Gemini");

        // Hangfire with PostgreSQL (no Redis needed!)
        services.AddHangfire(cfg => cfg
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(opts => opts.UseNpgsqlConnection(connectionString)));
        services.AddHangfireServer();

        return services;
    }
}

