using UserService.Notifications.Models.Dtos;

namespace UserService.Notifications;

public interface INotificationService
{
    Task<List<NotificationResponse>> GetForUserAsync(string userId, bool unreadOnly, int limit);
    Task<long> GetUnreadCountAsync(string userId);
    Task<bool> MarkReadAsync(string id, string userId);
    Task MarkAllReadAsync(string userId);

    /// <summary>Crea la notifica di richiesta d'amicizia per il destinatario (idempotente).</summary>
    Task CreateFriendRequestNotificationAsync(
        string addresseeId, string requesterId, string friendshipId);

    /// <summary>
    /// Crea una notifica per ciascun amico (accettato) del creatore del quiz, escluso il creatore.
    /// Idempotente per (amico, quiz).
    /// </summary>
    Task CreateQuizNotificationsAsync(
        string creatorId, string creatorUsername, string quizId, string quizTitle);
}
