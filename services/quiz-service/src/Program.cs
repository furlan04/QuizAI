using System.Text.Json;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using MongoDB.Driver;
using QuizService.Documents;
using QuizService.Messaging.Consumers;
using QuizService.Messaging.Publishers;
using QuizService.Quizzes;
using QuizService.Quizzes.Models;
using QuizService.Sessions;
using QuizService.Sessions.Models;
using QuizService.Users;
using QuizService.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Mappature MongoDB a runtime: tiene il dominio puro (entità senza attributi Bson).
MongoMappings.Register();

var cfg = builder.Configuration;
var mongoUrl      = cfg["MONGODB_URL"]       ?? "mongodb://localhost:27017";
var mongoDb       = cfg["MONGODB_DB"]        ?? "quizai";
var mqUrl         = cfg["RABBITMQ_URL"]      ?? "amqp://guest:guest@localhost:5672/";
var authServiceUrl = cfg["AUTH_SERVICE_URL"] ?? "http://localhost:5001";
var aiAgentUrl    = cfg["AI_AGENT_URL"]      ?? "http://localhost:8000";
var internalApiKey = cfg["INTERNAL_API_KEY"] ?? "changeme";
var jwtIssuer     = cfg["JWT_ISSUER"]        ?? "quizai";
var jwtAudience   = cfg["JWT_AUDIENCE"]      ?? "quizai";
var frontendUrl   = cfg["FRONTEND_URL"]?.TrimEnd('/') ?? "http://localhost:3000";

// ── MongoDB ──────────────────────────────────────────────────────────────────
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoUrl));
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(mongoDb));

// ── Repositories & services ──────────────────────────────────────────────────
builder.Services.AddSingleton<IQuizRepository, QuizRepository>();
builder.Services.AddSingleton<ISessionRepository, SessionRepository>();
builder.Services.AddSingleton<IUserRepository, UserRepository>();
builder.Services.AddScoped<IQuizGenerationPublisher, QuizGenerationPublisher>();
builder.Services.AddScoped<IQuizCreatedPublisher, QuizCreatedPublisher>();
builder.Services.AddScoped<ISessionService, SessionService>();

// ── Document extraction (ai-agent-service) ───────────────────────────────────
builder.Services.AddHttpClient<IDocumentExtractionClient, DocumentExtractionClient>(c =>
{
    c.BaseAddress = new Uri(aiAgentUrl);
    c.DefaultRequestHeaders.Add("X-Internal-Api-Key", internalApiKey);
    c.Timeout = TimeSpan.FromSeconds(60);
});

// ── JWT Authentication via JWKS (auth-service) ───────────────────────────────
// auth-service espone GET /.well-known/openid-configuration → jwks_uri
// JwtBearer recupera automaticamente la chiave pubblica RSA senza riavvii
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MetadataAddress     = $"{authServiceUrl}/.well-known/openid-configuration";
        o.RequireHttpsMetadata = false;
        o.MapInboundClaims     = false; // mantieni i claim originali: sub, email, username
        o.TokenValidationParameters = new()
        {
            ValidIssuer   = jwtIssuer,
            ValidAudience = jwtAudience,
        };
        o.Events = new JwtBearerEvents
        {
            // Il frontend non manda più l'header Authorization: il token sta nel
            // cookie httpOnly `access_token`. L'header resta supportato come fallback.
            OnMessageReceived = context =>
            {
                if (string.IsNullOrEmpty(context.Token))
                    context.Token = context.Request.Cookies["access_token"];
                return Task.CompletedTask;
            }
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

// AllowCredentials è necessario perché il cookie httpOnly viaggi cross-origin;
// impone di elencare l'origine esplicita (non combinabile con AllowAnyOrigin).
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(frontendUrl)
     .AllowAnyHeader()
     .AllowAnyMethod()
     .AllowCredentials()));

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
