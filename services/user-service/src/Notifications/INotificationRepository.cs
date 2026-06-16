using UserService.Notifications.Models;

namespace UserService.Notifications;

public interface INotificationRepository
{
    Task CreateAsync(Notification notification);
    Task CreateManyAsync(IReadOnlyCollection<Notification> notifications);
    Task<List<Notification>> GetForUserAsync(string userId, bool unreadOnly, int limit);
    Task<long> CountUnreadAsync(string userId);

    /// <summary>Segna come letta una notifica del destinatario indicato. True se aggiornata.</summary>
    Task<bool> MarkReadAsync(string id, string userId);
    Task MarkAllReadAsync(string userId);

    /// <summary>Vero se esiste già una notifica (userId, type, referenceId): garantisce idempotenza.</summary>
    Task<bool> ExistsAsync(string userId, string type, string referenceId);
}
