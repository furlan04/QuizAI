using System.Text;
using System.Text.Json;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using QuizService.Auth;
using QuizService.Messaging.Consumers;
using QuizService.Messaging.Publishers;
using QuizService.Quizzes;
using QuizService.Quizzes.Models;
using QuizService.Sessions;
using QuizService.Sessions.Models;
using QuizService.Users;

var builder = WebApplication.CreateBuilder(args);

var cfg = builder.Configuration;
var mongoUrl  = cfg["MONGODB_URL"]       ?? "mongodb://localhost:27017";
var mongoDb   = cfg["MONGODB_DB"]        ?? "quizai";
var mqUrl     = cfg["RABBITMQ_URL"]      ?? "amqp://guest:guest@localhost:5672/";
var jwtSecret = cfg["JWT_SECRET"]        ?? throw new Exception("JWT_SECRET required");
var jwtIssuer = cfg["JWT_ISSUER"]        ?? "quizai";
var jwtAud    = cfg["JWT_AUDIENCE"]      ?? "quizai";
var jwtExpiry = int.Parse(cfg["JWT_EXPIRY_HOURS"] ?? "24");

// ── MongoDB ──────────────────────────────────────────────────────────────────
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoUrl));
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(mongoDb));

// ── Repositories & services ──────────────────────────────────────────────────
builder.Services.AddSingleton<IQuizRepository, QuizRepository>();
builder.Services.AddSingleton<ISessionRepository, SessionRepository>();
builder.Services.AddSingleton<IUserRepository, UserRepository>();
builder.Services.AddSingleton<JwtTokenGenerator>();
builder.Services.AddScoped<IQuizGenerationPublisher, QuizGenerationPublisher>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISessionService, SessionService>();

// ── JWT Authentication ───────────────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtIssuer,
        ValidAudience            = jwtAud,
        IssuerSigningKey         = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSecret)),
    });
builder.Services.AddAuthorization();

// ── MassTransit / RabbitMQ ───────────────────────────────────────────────────
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<QuizGeneratedConsumer>();

    x.UsingRabbitMq((ctx, mqCfg) =>
    {
        mqCfg.Host(new Uri(mqUrl));

        // Raw JSON — no MassTransit envelope so Python can produce/consume natively
        mqCfg.UseRawJsonSerializer(RawSerializerOptions.AnyMessageType, isDefault: true);
        mqCfg.UseRawJsonDeserializer(RawSerializerOptions.AnyMessageType, isDefault: true);
        mqCfg.ConfigureJsonSerializerOptions(opts =>
        {
            // snake_case ↔ PascalCase for Python compatibility
            opts.PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower;
            opts.PropertyNameCaseInsensitive = true;
            return opts;
        });

        mqCfg.ReceiveEndpoint("quiz.generated", e =>
        {
            e.ConfigureConsumer<QuizGeneratedConsumer>(ctx);
        });
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// ── MongoDB indexes ───────────────────────────────────────────────────────────
await CreateIndexesAsync(app.Services);

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

// ─────────────────────────────────────────────────────────────────────────────
static async Task CreateIndexesAsync(IServiceProvider sp)
{
    var db = sp.GetRequiredService<IMongoDatabase>();

    var sessions = db.GetCollection<Session>("sessions");
    await sessions.Indexes.CreateManyAsync(
    [
        new CreateIndexModel<Session>(
            Builders<Session>.IndexKeys.Ascending(s => s.UserId)),
        new CreateIndexModel<Session>(
            Builders<Session>.IndexKeys.Ascending(s => s.QuizId)),
    ]);

    var quizzes = db.GetCollection<Quiz>("quizzes");
    await quizzes.Indexes.CreateManyAsync(
    [
        new CreateIndexModel<Quiz>(
            Builders<Quiz>.IndexKeys.Ascending(q => q.Status)),
        new CreateIndexModel<Quiz>(
            Builders<Quiz>.IndexKeys.Ascending(q => q.CreatedBy)),
    ]);
}
