using UserService.Friendships.Models;
using UserService.Friendships.Models.Dtos;
using UserService.Users;

namespace UserService.Friendships;

public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}

public class FriendshipService : IFriendshipService
{
    private readonly IFriendshipRepository _repo;
    private readonly IUserRepository _users;

    public FriendshipService(IFriendshipRepository repo, IUserRepository users)
    {
        _repo  = repo;
        _users = users;
    }

    public async Task<List<FriendResponse>> GetFriendsAsync(string userId)
    {
        var friendships = await _repo.GetAcceptedAsync(userId);
        var friends = new List<FriendResponse>();

        foreach (var f in friendships)
        {
            var friendId = f.RequesterId == userId ? f.AddresseeId : f.RequesterId;
            var user = await _users.GetByIdAsync(friendId);
            if (user is not null)
                friends.Add(new FriendResponse(user.Id, user.Username, user.AvatarUrl, user.Bio));
        }

        return friends;
    }

    public async Task<List<FriendRequestResponse>> GetPendingRequestsAsync(string userId)
    {
        var pending = await _repo.GetPendingIncomingAsync(userId);
        var result = new List<FriendRequestResponse>();

        foreach (var f in pending)
        {
            var requester = await _users.GetByIdAsync(f.RequesterId);
            if (requester is not null)
                result.Add(new FriendRequestResponse(
                    f.Id, f.RequesterId, requester.Username, f.CreatedAt));
        }

        return result;
    }

    public async Task<FriendshipStatusResponse> SendRequestAsync(
        string requesterId, string targetUsername)
    {
        var target = await _users.GetByUsernameAsync(targetUsername)
            ?? throw new KeyNotFoundException($"User '{targetUsername}' not found.");

        var existing = await _repo.GetBetweenUsersAsync(requesterId, target.Id);
        if (existing is not null)
        {
            throw existing.Status == "accepted"
                ? new ConflictException("Siete già amici.")
                : new ConflictException("Richiesta già inviata.");
        }

        var friendship = new Friendship
        {
            RequesterId = requesterId,
            AddresseeId = target.Id,
            Status      = "pending",
            CreatedAt   = DateTime.UtcNow,
            UpdatedAt   = DateTime.UtcNow,
        };

        var id = await _repo.CreateAsync(friendship);
        return new FriendshipStatusResponse(id, "pending");
    }

    public async Task<FriendshipStatusResponse> RespondAsync(
        string friendshipId, string userId, string action)
    {
        var friendship = await _repo.GetByIdAsync(friendshipId)
            ?? throw new KeyNotFoundException("Friendship not found.");

        if (friendship.AddresseeId != userId)
            throw new UnauthorizedAccessException("Only the addressee can respond.");

        if (friendship.Status != "pending")
            throw new InvalidOperationException("Request is no longer pending.");

        var newStatus = action == "accept" ? "accepted" : "rejected";
        await _repo.UpdateStatusAsync(friendshipId, newStatus);
        return new FriendshipStatusResponse(friendshipId, newStatus);
    }

    public async Task RemoveFriendAsync(string userId, string targetUsername)
    {
        var target = await _users.GetByUsernameAsync(targetUsername)
            ?? throw new KeyNotFoundException($"User '{targetUsername}' not found.");

        await _repo.DeleteBetweenUsersAsync(userId, target.Id);
    }
}
