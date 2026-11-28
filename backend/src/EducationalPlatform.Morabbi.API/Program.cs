using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json.Serialization;
using EducationalPlatform.Morabbi.API.Middleware;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using EducationalPlatform.Morabbi.Infrastructure.Seeders;
using EducationalPlatform.Morabbi.Infrastructure.Security;
using EducationalPlatform.Morabbi.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
    });

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var oidcConfig = builder.Configuration.GetSection("Oidc");
var localAuthConfig = builder.Configuration.GetSection("LocalAuth");
var isDev = builder.Environment.IsDevelopment();

var localSecret = localAuthConfig["Secret"]
    ?? Environment.GetEnvironmentVariable("MORABBI_LOCAL_AUTH_SECRET");
if (string.IsNullOrWhiteSpace(localSecret))
{
    throw new InvalidOperationException("LocalAuth:Secret is empty — set it in appsettings.Development.json (dev) or via the MORABBI_LOCAL_AUTH_SECRET env var (prod).");
}
var localIssuer = localAuthConfig["Issuer"] ?? "http://localhost:3010";
var localAudience = localAuthConfig["Audience"] ?? localIssuer;
var localKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(localSecret));

var localValidationParams = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidIssuer = localIssuer,
    ValidateAudience = true,
    ValidAudience = localAudience,
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = localKey,
    ValidateLifetime = true,
    ValidTypes = new[] { "at+jwt" },
    NameClaimType = "sub",
    RoleClaimType = "role"
};

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.MapInboundClaims = false;

    if (isDev)
    {
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = localValidationParams;
    }
    else
    {
        options.Authority = oidcConfig["Authority"];
        options.RequireHttpsMetadata = oidcConfig.GetValue<bool>("RequireHttpsMetadata");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = oidcConfig["ValidAudience"] ?? "https://api.nehzat128.ir",
            ValidTypes = new[] { "at+jwt" },
            NameClaimType = "sub",
            RoleClaimType = "role"
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var authHeader = context.Request.Headers.Authorization.ToString();
                if (!authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    return Task.CompletedTask;
                }
                var token = authHeader["Bearer ".Length..];
                try
                {
                    var handler = new JsonWebTokenHandler();
                    var payload = handler.ReadJsonWebToken(token);
                    if (payload.Issuer != localIssuer)
                    {
                        return Task.CompletedTask;
                    }
                    var result = handler.ValidateToken(token, localValidationParams);
                    if (result.IsValid)
                    {
                        context.Success();
                    }
                }
                catch
                {
                    // keep the original failure
                }
                return Task.CompletedTask;
            }
        };
    }
});

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

builder.Services.AddHttpClient();
builder.Services.AddSingleton<ITokenService, TokenService>();
builder.Services.AddScoped<INehzatHubClient, NehzatHubClient>();
builder.Services.AddScoped<IMorabbiUserService, MorabbiUserService>();
builder.Services.AddScoped<IBranchService, BranchService>();
builder.Services.AddScoped<IMaktabService, MaktabService>();
builder.Services.AddScoped<IDailyReportService, DailyReportService>();
builder.Services.AddScoped<ILessonPlanService, LessonPlanService>();
builder.Services.AddScoped<IEvaluationService, EvaluationService>();
builder.Services.AddScoped<IRecognitionService, RecognitionService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IPushSubscriptionService, PushSubscriptionService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<ITarbiyatiService, TarbiyatiService>();
builder.Services.AddScoped<IPointsService, PointsService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IExportService, ExportService>();
builder.Services.AddScoped<ISearchService, SearchService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<IAiService, AiService>();
builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<SampleDataSeeder>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        if (allowedOrigins is not { Length: > 0 })
        {
            allowedOrigins = isDev ? new[] { "http://localhost:4210" } : Array.Empty<string>();
        }
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseAuthentication();
app.UseMiddleware<MorabbiSyncMiddleware>();
app.UseAuthorization();
app.MapControllers();
app.MapOpenApi("/openapi/v1.json");

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (args.Contains("--seed"))
    {
        db.Database.EnsureDeleted();
        if (db.Database.GetMigrations().Any()) db.Database.Migrate();
        else db.Database.EnsureCreated();
    }
    else
    {
        try
        {
            var connStr = db.Database.GetConnectionString();
            if (string.IsNullOrWhiteSpace(connStr))
                throw new InvalidOperationException("Database connection string is not configured.");

            if (!DatabaseExists(connStr))
            {
                if (db.Database.GetMigrations().Any()) db.Database.Migrate();
                else db.Database.EnsureCreated();
            }
            else if (db.Database.GetAppliedMigrations().Any())
            {
                if (db.Database.GetPendingMigrations().Any()) db.Database.Migrate();
            }
            else if (!HasTables(db))
            {
                if (db.Database.GetMigrations().Any()) db.Database.Migrate();
                else db.Database.EnsureCreated();
            }
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number is 918 or 4060)
        {
            if (db.Database.GetMigrations().Any()) db.Database.Migrate();
            else db.Database.EnsureCreated();
        }
    }

    var seeder = scope.ServiceProvider.GetRequiredService<SampleDataSeeder>();
    await seeder.SeedAsync();
}

app.Run();

static bool HasTables(AppDbContext db)
    => db.Database.SqlQueryRaw<int>("SELECT 1 AS [Value] FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'").Any();

static bool DatabaseExists(string connectionString)
{
    var builder = new SqlConnectionStringBuilder(connectionString);
    var dbName = builder.InitialCatalog;
    builder.InitialCatalog = "master";
    using var conn = new SqlConnection(builder.ConnectionString);
    conn.Open();
    using var cmd = new SqlCommand("SELECT COUNT(*) FROM sys.databases WHERE name = @name", conn);
    cmd.Parameters.AddWithValue("@name", dbName);
    return (int)cmd.ExecuteScalar() > 0;
}
