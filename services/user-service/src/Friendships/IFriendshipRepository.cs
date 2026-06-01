using UserService.Friendships.Models;

namespace UserService.Friendships;

public interface IFriendshipRepository
{
    Task<string> CreateAsync(Friendship friendship);
    Task<Friendship?> GetByIdAsync(string id);
    Task<Friendship?> GetBetweenUsersAsync(string userId1, string userId2);
    Task<List<Friendship>> GetAcceptedAsync(string userId);
    Task<List<Friendship>> GetPendingIncomingAsync(string userId);
    Task UpdateStatusAsync(string id, string status);
    Task DeleteBetweenUsersAsync(string userId1, string userId2);
    Task<bool> AreFriendsAsync(string userId1, string userId2);
}
