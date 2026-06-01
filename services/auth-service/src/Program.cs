using System.Text.Json;
using AuthService.Auth;
using AuthService.Email;
using AuthService.Identity;
using AuthService.Jwt;
using AuthService.Keys;
using AuthService.Messaging;
using MassTransit;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

var mysqlUrl = cfg["MYSQL_URL"]
    ?? "Server=localhost;Port=3306;Database=quizai_auth;Uid=root;Pwd=root;";
var mqUrl = cfg["RABBITMQ_URL"] ?? "amqp://guest:guest@localhost:5672/";

// ── MySQL + Identity ──────────────────────────────────────────────────────────
// Versione fissa: evita la connessione eager di AutoDetect durante la configurazione DI
var serverVersion = new MySqlServerVersion(new Version(8, 4, 0));
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(mysqlUrl, serverVersion));

builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequireDigit           = true;
    options.Password.RequiredLength         = 8;
    options.Password.RequireUppercase       = false;
    options.Password.RequireNonAlphanumeric = false;
    options.User.RequireUniqueEmail         = true;
    options.SignIn.RequireConfirmedEmail    = true; // login bloccato finché email non confermata
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ── RSA keys + JWT ────────────────────────────────────────────────────────────
builder.Services.AddSingleton<RsaKeyProvider>();
builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService.Auth.AuthService>();
builder.Services.AddScoped<IUserRegisteredPublisher, UserRegisteredPublisher>();
builder.Services.AddSingleton<IGoogleTokenValidator, GoogleTokenValidator>();

// ── Email sender ────────────────────────────────────────────────────────────
// Se SMTP_HOST è configurato → invia davvero; altrimenti logga in console (dev)
if (!string.IsNullOrWhiteSpace(cfg["SMTP_HOST"]))
    builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
else
    builder.Services.AddSingleton<IEmailSender, LoggerEmailSender>();

// ── MassTransit / RabbitMQ ───────────────────────────────────────────────────
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((ctx, mqCfg) =>
    {
        mqCfg.Host(new Uri(mqUrl));
        mqCfg.UseRawJsonSerializer(RawSerializerOptions.AnyMessageType, isDefault: true);
        mqCfg.ConfigureJsonSerializerOptions(opts =>
        {
            opts.PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower;
            opts.PropertyNameCaseInsensitive = true;
            return opts;
        });
    });
});

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o =>
{
    o.SwaggerDoc("v1", new() { Title = "QuizAI — Auth Service", Version = "v1" });
    o.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
    });
    o.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                    { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            []
        }
    });
});

builder.Services.AddControllers();

// ── CORS (frontend) ─────────────────────────────────────────────────────────
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// ── Auto-migrate MySQL on startup (con retry: MySQL può non essere subito pronto) ──
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    const int maxAttempts = 15;
    for (var attempt = 1; ; attempt++)
    {
        try
        {
            await db.Database.MigrateAsync();
            break;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            logger.LogWarning("MySQL non pronto (tentativo {Attempt}/{Max}): {Msg}. Riprovo in 4s...",
                attempt, maxAttempts, ex.Message);
            await Task.Delay(4000);
        }
    }
}

app.UseSwagger();
app.UseSwaggerUI(o =>
    o.SwaggerEndpoint("/swagger/v1/swagger.json", "Auth Service v1"));

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
