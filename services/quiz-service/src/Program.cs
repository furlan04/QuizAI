using System.Text.Json;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using MongoDB.Driver;
using QuizService.Messaging.Consumers;
using QuizService.Messaging.Publishers;
using QuizService.Quizzes;
using QuizService.Quizzes.Models;
using QuizService.Sessions;
using QuizService.Sessions.Models;
using QuizService.Users;

var builder = WebApplication.CreateBuilder(args);

var cfg = builder.Configuration;
var mongoUrl      = cfg["MONGODB_URL"]       ?? "mongodb://localhost:27017";
var mongoDb       = cfg["MONGODB_DB"]        ?? "quizai";
var mqUrl         = cfg["RABBITMQ_URL"]      ?? "amqp://guest:guest@localhost:5672/";
var authServiceUrl = cfg["AUTH_SERVICE_URL"] ?? "http://localhost:5001";
var jwtIssuer     = cfg["JWT_ISSUER"]        ?? "quizai";
var jwtAudience   = cfg["JWT_AUDIENCE"]      ?? "quizai";

// ── MongoDB ──────────────────────────────────────────────────────────────────
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoUrl));
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(mongoDb));

// ── Repositories & services ──────────────────────────────────────────────────
builder.Services.AddSingleton<IQuizRepository, QuizRepository>();
builder.Services.AddSingleton<ISessionRepository, SessionRepository>();
builder.Services.AddSingleton<IUserRepository, UserRepository>();
builder.Services.AddScoped<IQuizGenerationPublisher, QuizGenerationPublisher>();
builder.Services.AddScoped<ISessionService, SessionService>();

// ── JWT Authentication via JWKS (auth-service) ───────────────────────────────
// auth-service espone GET /.well-known/openid-configuration → jwks_uri
// JwtBearer recupera automaticamente la chiave pubblica RSA senza riavvii
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MetadataAddress     = $"{authServiceUrl}/.well-known/openid-configuration";
        o.RequireHttpsMetadata = false;
        o.TokenValidationParameters = new()
        {
            ValidIssuer   = jwtIssuer,
            ValidAudience = jwtAudience,
        };
    });
builder.Services.AddAuthorization();

// ── MassTransit / RabbitMQ ───────────────────────────────────────────────────
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<QuizGeneratedConsumer>();

    x.UsingRabbitMq((ctx, mqCfg) =>
    {
        mqCfg.Host(new Uri(mqUrl));

        mqCfg.UseRawJsonSerializer(RawSerializerOptions.AnyMessageType, isDefault: true);
        mqCfg.UseRawJsonDeserializer(RawSerializerOptions.AnyMessageType, isDefault: true);
        mqCfg.ConfigureJsonSerializerOptions(opts =>
        {
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

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o =>
{
    o.SwaggerDoc("v1", new() { Title = "QuizAI — Quiz Service", Version = "v1" });
    o.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description  = "Token JWT ottenuto da auth-service POST /auth/login",
    });
    o.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            []
        }
    });
});

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

await CreateIndexesAsync(app.Services);

app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "Quiz Service v1"));

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

static async Task CreateIndexesAsync(IServiceProvider sp)
{
    var db = sp.GetRequiredService<IMongoDatabase>();

    var sessions = db.GetCollection<Session>("sessions");
    await sessions.Indexes.CreateManyAsync(
    [
        new CreateIndexModel<Session>(Builders<Session>.IndexKeys.Ascending(s => s.UserId)),
        new CreateIndexModel<Session>(Builders<Session>.IndexKeys.Ascending(s => s.QuizId)),
    ]);

    var quizzes = db.GetCollection<Quiz>("quizzes");
    await quizzes.Indexes.CreateManyAsync(
    [
        new CreateIndexModel<Quiz>(Builders<Quiz>.IndexKeys.Ascending(q => q.Status)),
        new CreateIndexModel<Quiz>(Builders<Quiz>.IndexKeys.Ascending(q => q.CreatedBy)),
    ]);
}
