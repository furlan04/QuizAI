namespace UserService.Notifications.Models.Dtos;

public record NotificationResponse(
    string Id,
    string Type,
    bool Read,
    DateTime CreatedAt,
    string ActorId,
    string ActorUsername,
    string? QuizId,
    string? QuizTitle,
    string? FriendshipId);

public record UnreadCountResponse(long Count);
