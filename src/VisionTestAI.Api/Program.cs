using System.Text;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using VisionTestAI.Api.Hubs;
using VisionTestAI.Api.Middleware;
using VisionTestAI.Application;
using VisionTestAI.Infrastructure;

// ── Load .env file so env vars work outside Docker Compose ──
LoadEnvFile();

var builder = WebApplication.CreateBuilder(args);

// Lightweight .env file loader — searches current dir and up to 4 parents
static void LoadEnvFile()
{
    var dir = Directory.GetCurrentDirectory();
    string? envPath = null;

    // Walk up to find the .env file (handles running from src/Api vs project root)
    for (var i = 0; i < 5 && dir is not null; i++)
    {
        var candidate = Path.Combine(dir, ".env");
        if (File.Exists(candidate)) { envPath = candidate; break; }
        dir = Directory.GetParent(dir)?.FullName;
    }

    if (envPath is null) return;

    foreach (var line in File.ReadAllLines(envPath))
    {
        var trimmed = line.Trim();
        if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#')) continue;
        var idx = trimmed.IndexOf('=');
        if (idx <= 0) continue;
        var key = trimmed[..idx].Trim();
        var val = trimmed[(idx + 1)..].Trim();
        // Only set if not already defined (real env vars take precedence)
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
        {
            Environment.SetEnvironmentVariable(key, val);
        }

        // Map docker-compose-style env vars to ASP.NET config keys
        // e.g. GEMINI_API_KEY -> Gemini__ApiKey (matches docker-compose.yml mapping)
        if (key == "GEMINI_API_KEY" && string.IsNullOrEmpty(Environment.GetEnvironmentVariable("Gemini__ApiKey")))
        {
            Environment.SetEnvironmentVariable("Gemini__ApiKey", val);
        }
    }
}

// ─── Serilog ───
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

// ─── Services ───
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ─── JWT Authentication ───
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };

    // Allow SignalR to receive the JWT via query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ─── SignalR ───
builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 512 * 1024; // 512KB for screenshots
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
});
builder.Services.AddScoped<VisionTestAI.Application.Common.Interfaces.ITestStreamService, VisionTestAI.Api.Services.TestStreamService>();

// ─── CORS ───
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ??
                new[] { "http://localhost:5173", "http://localhost:3000" })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ─── Swagger ───
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "VisionTest AI API",
        Version = "v1",
        Description = "AI-Powered Visual Testing Platform - تحويل اللغة الطبيعية إلى اختبارات مرئية"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "JWT token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// ─── Middleware Pipeline ───
app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowClient");

// Serve React static files
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<TenantMiddleware>();

app.MapControllers();
app.MapHub<TestStreamHub>("/hubs/test-stream");

// Hangfire Dashboard (admin only in production)
app.UseHangfireDashboard("/hangfire");

// Auto-migrate database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<VisionTestAI.Infrastructure.Data.AppDbContext>();
    db.Database.Migrate();
}

app.Run();
