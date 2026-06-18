namespace UserService.Buddy;

using MongoDB.Driver;
using UserService.Buddy.Models;

public class BuddyService : IBuddyService
{
    private readonly IMongoCollection<BuddySession> _sessions;
    private readonly IConfiguration _config;
    private static readonly HttpClient _httpClient = new HttpClient();

    public BuddyService(IMongoDatabase database, IConfiguration config)
    {
        _sessions = database.GetCollection<BuddySession>("buddy_sessions");
        _config = config;
    }

    public async Task<BuddySession> CreateSessionAsync(string sessionId, string userId, string title)
    {
        var session = new BuddySession
        {
            Id = sessionId,
            UserId = userId,
            Title = title,
            CreatedAt = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow,
            History = new List<BuddyMessage>()
        };

        await _sessions.InsertOneAsync(session);
        return session;
    }

    public async Task<IEnumerable<BuddySession>> GetSessionsAsync(string userId)
    {
        var filter = Builders<BuddySession>.Filter.Eq(s => s.UserId, userId);
        var projection = Builders<BuddySession>.Projection
            .Include(s => s.Id)
            .Include(s => s.Title)
            .Include(s => s.LastMessageAt);

        return await _sessions.Find(filter)
            .Project<BuddySession>(projection)
            .SortByDescending(s => s.LastMessageAt)
            .ToListAsync();
    }

    public async Task<BuddySession?> GetSessionAsync(string sessionId, string userId)
    {
        return await _sessions.Find(s => s.Id == sessionId && s.UserId == userId).FirstOrDefaultAsync();
    }

    public async Task<bool> UpdateHistoryAsync(string sessionId, string userId, List<BuddyMessage> history)
    {
        var filter = Builders<BuddySession>.Filter.And(
            Builders<BuddySession>.Filter.Eq(s => s.Id, sessionId),
            Builders<BuddySession>.Filter.Eq(s => s.UserId, userId)
        );

        var update = Builders<BuddySession>.Update
            .Set(s => s.History, history)
            .Set(s => s.LastMessageAt, DateTime.UtcNow);

        var result = await _sessions.UpdateOneAsync(filter, update);
        return result.MatchedCount > 0;
    }

    public async Task<bool> DeleteSessionAsync(string sessionId, string userId)
    {
        var filter = Builders<BuddySession>.Filter.And(
            Builders<BuddySession>.Filter.Eq(s => s.Id, sessionId),
            Builders<BuddySession>.Filter.Eq(s => s.UserId, userId)
        );

        var result = await _sessions.DeleteOneAsync(filter);

        if (result.DeletedCount > 0)
        {
            var fileServiceUrl = _config["FILE_SERVICE_URL"] ?? "http://file-service:8001";
            try
            {
                await _httpClient.DeleteAsync($"{fileServiceUrl.TrimEnd('/')}/buddy/{sessionId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error notifying file-service for deletion of buddy session {sessionId}: {ex.Message}");
            }
            return true;
        }

        return false;
    }
}
