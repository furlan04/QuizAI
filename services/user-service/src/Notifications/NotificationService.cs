using UserService.Friendships;
using UserService.Notifications.Models;
using UserService.Notifications.Models.Dtos;
using UserService.Users;

namespace UserService.Notifications;

public class NotificationService : INotificationService
{
    public const string TypeFriendRequest = "friend_request";
    public const string TypeQuizCreated   = "quiz_created";

    private const int MaxLimit = 100;

    private readonly INotificationRepository _repo;
    private readonly IFriendshipRepository _friendships;
    private readonly IUserRepository _users;

    public NotificationService(
        INotificationRepository repo,
        IFriendshipRepository friendships,
        IUserRepository users)
    {
        _repo        = repo;
        _friendships = friendships;
        _users       = users;
    }

    public async Task<List<NotificationResponse>> GetForUserAsync(
        string userId, bool unreadOnly, int limit)
    {
        var bounded = Math.Clamp(limit, 1, MaxLimit);
        var items = await _repo.GetForUserAsync(userId, unreadOnly, bounded);
        return items.Select(ToResponse).ToList();
    }

    public Task<long> GetUnreadCountAsync(string userId) =>
        _repo.CountUnreadAsync(userId);

    public Task<bool> MarkReadAsync(string id, string userId) =>
        _repo.MarkReadAsync(id, userId);

    public Task MarkAllReadAsync(string userId) =>
        _repo.MarkAllReadAsync(userId);

    public async Task CreateFriendRequestNotificationAsync(
        string addresseeId, string requesterId, string friendshipId)
    {
        if (await _repo.ExistsAsync(addresseeId, TypeFriendRequest, friendshipId))
            return; // riconsegna del messaggio: niente duplicati

        var requester = await _users.GetByIdAsync(requesterId);

        await _repo.CreateAsync(new Notification
        {
            UserId        = addresseeId,
            Type          = TypeFriendRequest,
            Read          = false,
            CreatedAt     = DateTime.UtcNow,
            ActorId       = requesterId,
            ActorUsername = requester?.Username ?? "",
            ReferenceId   = friendshipId,
            FriendshipId  = friendshipId,
        });
    }

    public async Task CreateQuizNotificationsAsync(
        string creatorId, string creatorUsername, string quizId, string quizTitle)
    {
        var friendships = await _friendships.GetAcceptedAsync(creatorId);

        var toCreate = new List<Notification>();
        foreach (var f in friendships)
        {
            var friendId = f.RequesterId == creatorId ? f.AddresseeId : f.RequesterId;
            if (friendId == creatorId) continue; // robustezza: mai notificare sé stessi

            if (await _repo.ExistsAsync(friendId, TypeQuizCreated, quizId))
                continue; // già notificato (riconsegna)

            toCreate.Add(new Notification
            {
                UserId        = friendId,
                Type          = TypeQuizCreated,
                Read          = false,
                CreatedAt     = DateTime.UtcNow,
                ActorId       = creatorId,
                ActorUsername = creatorUsername,
                ReferenceId   = quizId,
                QuizId        = quizId,
                QuizTitle     = quizTitle,
            });
        }

        await _repo.CreateManyAsync(toCreate);
    }

    private static NotificationResponse ToResponse(Notification n) => new(
        n.Id, n.Type, n.Read, n.CreatedAt,
        n.ActorId, n.ActorUsername, n.QuizId, n.QuizTitle, n.FriendshipId);
}
