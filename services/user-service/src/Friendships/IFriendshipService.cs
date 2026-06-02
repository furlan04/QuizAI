using UserService.Friendships.Models.Dtos;

namespace UserService.Friendships;

public interface IFriendshipService
{
    Task<List<FriendResponse>> GetFriendsAsync(string userId);
    Task<List<FriendRequestResponse>> GetPendingRequestsAsync(string userId);
    Task<FriendshipStatusResponse> SendRequestAsync(string requesterId, string targetUsername);
    Task<FriendshipStatusResponse> RespondAsync(string friendshipId, string userId, string action);
    Task RemoveFriendAsync(string userId, string targetUsername);
    Task<FriendshipStatusDetail> GetStatusAsync(string currentUserId, string targetUsername);
}
