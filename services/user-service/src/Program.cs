using System.Text.Json;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using MongoDB.Driver;
using UserService.Challenges;
using UserService.Challenges.Models;
using UserService.Friendships;
using UserService.Friendships.Models;
using UserService.Messaging.Consumers;
using UserService.Messaging.Publishers;
using UserService.Notifications;
using UserService.Notifications.Models;
using UserService.Users;
using UserService.Users.Models;
using UserService.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Mappature MongoDB a runtime: tiene il dominio puro (entità senza attributi Bson).
MongoMappings.Register();

var cfg = builder.Configuration;

var mongoUrl       = cfg["MONGODB_URL"]        ?? "mongodb://localhost:27017";
var mongoDb        = cfg["MONGODB_DB"]         ?? "quizai_users";
var mqUrl          = cfg["RABBITMQ_URL"]       ?? "amqp://guest:guest@localhost:5672/";
var authServiceUrl = cfg["AUTH_SERVICE_URL"]   ?? "http://localhost:5001";
var jwtIssuer      = cfg["JWT_ISSUER"]         ?? "quizai";
var jwtAudience    = cfg["JWT_AUDIENCE"]       ?? "quizai";
var frontendUrl    = cfg["FRONTEND_URL"]?.TrimEnd('/') ?? "http://localhost:3000";

// ── MongoDB ──────────────────────────────────────────────────────────────────
builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoUrl));
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase(mongoDb));

// ── Repositories & services ──────────────────────────────────────────────────
builder.Services.AddSingleton<IUserRepository, UserRepository>();
builder.Services.AddSingleton<IFriendshipRepository, FriendshipRepository>();
builder.Services.AddSingleton<IChallengeRepository, ChallengeRepository>();
builder.Services.AddSingleton<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IUserService, UserService.Users.UserService>();
builder.Services.AddScoped<IFriendshipService, FriendshipService>();
builder.Services.AddScoped<IChallengeService, ChallengeService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<UserService.Buddy.IBuddyService, UserService.Buddy.BuddyService>();
builder.Services.AddScoped<IChallengeCreatedPublisher, ChallengeCreatedPublisher>();
builder.Services.AddScoped<IFriendRequestPublisher, FriendRequestPublisher>();

// ── JWT via JWKS (auth-service) ──────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MetadataAddress      = $"{authServiceUrl}/.well-known/openid-configuration";
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
    x.AddConsumer<QuizCompletedConsumer>();
    x.AddConsumer<UserRegisteredConsumer>();
    x.AddConsumer<QuizCreatedConsumer>();
    x.AddConsumer<FriendRequestNotificationConsumer>();

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

        mqCfg.ReceiveEndpoint("quiz.completed", e =>
        {
            e.ConfigureConsumer<QuizCompletedConsumer>(ctx);
        });
        mqCfg.ReceiveEndpoint("user.registered", e =>
        {
            e.ConfigureConsumer<UserRegisteredConsumer>(ctx);
        });
        mqCfg.ReceiveEndpoint("quiz.created", e =>
        {
            e.ConfigureConsumer<QuizCreatedConsumer>(ctx);
        });
        mqCfg.ReceiveEndpoint("friend.request.sent", e =>
        {
            e.ConfigureConsumer<FriendRequestNotificationConsumer>(ctx);
        });
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o =>
{
    o.SwaggerDoc("v1", new() { Title = "QuizAI — User Service", Version = "v1" });
    o.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization", Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer", BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Token JWT ottenuto da auth-service",
    });
    o.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            }, []
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
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "User Service v1"));

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

static async Task CreateIndexesAsync(IServiceProvider sp)
{
    var db = sp.GetRequiredService<IMongoDatabase>();

    var users = db.GetCollection<User>("users");
    await users.Indexes.CreateManyAsync(
    [
        new CreateIndexModel<User>(
            Builders<User>.IndexKeys.Ascending(u => u.Username),
            new CreateIndexOptions { Unique = true }),
        new CreateIndexModel<User>(
            Builders<User>.IndexKeys.Ascending(u => u.Email),
            new CreateIndexOptions { Unique = true }),
    ]);

    var friendships = db.GetCollection<Friendship>("friendships");
    await friendships.Indexes.CreateManyAsync(
    [
        new CreateIndexModel<Friendship>(
            Builders<Friendship>.IndexKeys
                .Ascending(f => f.RequesterId)
                .Ascending(f => f.AddresseeId),
            new CreateIndexOptions { Unique = true }),
        new CreateIndexModel<Friendship>(
            Builders<Friendship>.IndexKeys
                .Ascending(f => f.AddresseeId)
                .Ascending(f => f.Status)),
    ]);

    var challenges = db.GetCollection<Challenge>("challenges");
    await challenges.Indexes.CreateManyAsync(
    [
        new CreateIndexModel<Challenge>(
            Builders<Challenge>.IndexKeys
                .Ascending(c => c.ChallengerId)
                .Ascending(c => c.Status)),
        new CreateIndexModel<Challenge>(
            Builders<Challenge>.IndexKeys
                .Ascending(c => c.ChallengedId)
                .Ascending(c => c.Status)),
        new CreateIndexModel<Challenge>(
            Builders<Challenge>.IndexKeys
                .Ascending(c => c.QuizId)
                .Ascending(c => c.Status)),
    ]);

    var notifications = db.GetCollection<Notification>("notifications");
    await notifications.Indexes.CreateManyAsync(
    [
        // Lista per utente, ordinata dalla più recente.
        new CreateIndexModel<Notification>(
            Builders<Notification>.IndexKeys
                .Ascending(n => n.UserId)
                .Descending(n => n.CreatedAt)),
        // Conteggio non lette.
        new CreateIndexModel<Notification>(
            Builders<Notification>.IndexKeys
                .Ascending(n => n.UserId)
                .Ascending(n => n.Read)),
        // Deduplica idempotente (utente, tipo, riferimento).
        new CreateIndexModel<Notification>(
            Builders<Notification>.IndexKeys
                .Ascending(n => n.UserId)
                .Ascending(n => n.Type)
                .Ascending(n => n.ReferenceId)),
    ]);
}
