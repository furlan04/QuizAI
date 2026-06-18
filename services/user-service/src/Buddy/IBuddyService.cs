namespace UserService.Buddy;

using UserService.Buddy.Models;

public interface IBuddyService
{
    Task<BuddySession> CreateSessionAsync(string sessionId, string userId, string title);
    Task<IEnumerable<BuddySession>> GetSessionsAsync(string userId);
    Task<BuddySession?> GetSessionAsync(string sessionId, string userId);
    Task<bool> UpdateHistoryAsync(string sessionId, string userId, List<BuddyMessage> history);
    Task<bool> DeleteSessionAsync(string sessionId, string userId);
}
