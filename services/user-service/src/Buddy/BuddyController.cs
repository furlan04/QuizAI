namespace UserService.Buddy;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;
using UserService.Buddy.Models;

public class CreateBuddySessionRequest
{
    public string SessionId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
}

public class UpdateBuddySessionHistoryRequest
{
    public List<BuddyMessage> History { get; set; } = new();
}

[ApiController]
[Route("users/buddy/sessions")]
[Authorize]
public class BuddyController : ControllerBase
{
    private readonly IMongoCollection<BuddySession> _sessions;
    private readonly IConfiguration _config;
    private static readonly HttpClient _httpClient = new HttpClient();

    public BuddyController(IMongoDatabase database, IConfiguration config)
    {
        _sessions = database.GetCollection<BuddySession>("buddy_sessions");
        _config = config;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!;

    [HttpPost]
    public async Task<IActionResult> CreateSession([FromBody] CreateBuddySessionRequest request)
    {
        var session = new BuddySession
        {
            Id = request.SessionId,
            UserId = GetUserId(),
            Title = request.Title,
            CreatedAt = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow,
            History = new List<BuddyMessage>()
        };

        await _sessions.InsertOneAsync(session);
        return Ok(session);
    }

    [HttpGet]
    public async Task<IActionResult> GetSessions()
    {
        var userId = GetUserId();
        var filter = Builders<BuddySession>.Filter.Eq(s => s.UserId, userId);
        var projection = Builders<BuddySession>.Projection
            .Include(s => s.Id)
            .Include(s => s.Title)
            .Include(s => s.LastMessageAt);

        var sessions = await _sessions.Find(filter)
            .Project<BuddySession>(projection)
            .SortByDescending(s => s.LastMessageAt)
            .ToListAsync();

        return Ok(sessions.Select(s => new 
        {
            id = s.Id,
            title = s.Title,
            last_message_at = s.LastMessageAt
        }));
    }

    [HttpGet("{sessionId}")]
    public async Task<IActionResult> GetSession(string sessionId)
    {
        var userId = GetUserId();
        var session = await _sessions.Find(s => s.Id == sessionId && s.UserId == userId).FirstOrDefaultAsync();

        if (session == null)
        {
            return NotFound(new { error = "Session not found." });
        }

        return Ok(session);
    }

    [HttpPatch("{sessionId}")]
    public async Task<IActionResult> UpdateHistory(string sessionId, [FromBody] UpdateBuddySessionHistoryRequest request)
    {
        var userId = GetUserId();
        var filter = Builders<BuddySession>.Filter.And(
            Builders<BuddySession>.Filter.Eq(s => s.Id, sessionId),
            Builders<BuddySession>.Filter.Eq(s => s.UserId, userId)
        );

        var update = Builders<BuddySession>.Update
            .Set(s => s.History, request.History)
            .Set(s => s.LastMessageAt, DateTime.UtcNow);

        var result = await _sessions.UpdateOneAsync(filter, update);

        if (result.MatchedCount == 0)
        {
            return NotFound(new { error = "Session not found." });
        }

        return Ok(new { status = "updated" });
    }

    [HttpDelete("{sessionId}")]
    public async Task<IActionResult> DeleteSession(string sessionId)
    {
        var userId = GetUserId();
        var filter = Builders<BuddySession>.Filter.And(
            Builders<BuddySession>.Filter.Eq(s => s.Id, sessionId),
            Builders<BuddySession>.Filter.Eq(s => s.UserId, userId)
        );

        var result = await _sessions.DeleteOneAsync(filter);

        if (result.DeletedCount == 0)
        {
            return NotFound(new { error = "Session not found." });
        }

        var fileServiceUrl = _config["FILE_SERVICE_URL"] ?? "http://file-service:8001";
        
        try
        {
            await _httpClient.DeleteAsync($"{fileServiceUrl.TrimEnd('/')}/buddy/{sessionId}");
        }
        catch (Exception ex)
        {
            // Log it normally, but proceed since Mongo deletion succeeded.
            Console.WriteLine($"Error notifying file-service for deletion of buddy session {sessionId}: {ex.Message}");
        }

        return Ok(new { status = "deleted" });
    }
}
