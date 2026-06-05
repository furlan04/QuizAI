using MongoDB.Bson;
using MongoDB.Driver;
using UserService.Notifications.Models;

namespace UserService.Notifications;

public class NotificationRepository : INotificationRepository
{
    private readonly IMongoCollection<Notification> _col;

    public NotificationRepository(IMongoDatabase db)
        => _col = db.GetCollection<Notification>("notifications");

    public Task CreateAsync(Notification notification) =>
        _col.InsertOneAsync(notification);

    public Task CreateManyAsync(IReadOnlyCollection<Notification> notifications)
    {
        if (notifications.Count == 0) return Task.CompletedTask;
        return _col.InsertManyAsync(notifications);
    }

    public Task<List<Notification>> GetForUserAsync(string userId, bool unreadOnly, int limit)
    {
        var filter = unreadOnly
            ? Builders<Notification>.Filter.And(
                Builders<Notification>.Filter.Eq(n => n.UserId, userId),
                Builders<Notification>.Filter.Eq(n => n.Read, false))
            : Builders<Notification>.Filter.Eq(n => n.UserId, userId);

        return _col.Find(filter)
            .SortByDescending(n => n.CreatedAt)
            .Limit(limit)
            .ToListAsync();
    }

    public Task<long> CountUnreadAsync(string userId) =>
        _col.CountDocumentsAsync(n => n.UserId == userId && !n.Read);

    public async Task<bool> MarkReadAsync(string id, string userId)
    {
        if (!ObjectId.TryParse(id, out _)) return false;

        var result = await _col.UpdateOneAsync(
            n => n.Id == id && n.UserId == userId,
            Builders<Notification>.Update.Set(n => n.Read, true));

        return result.ModifiedCount > 0;
    }

    public Task MarkAllReadAsync(string userId) =>
        _col.UpdateManyAsync(
            n => n.UserId == userId && !n.Read,
            Builders<Notification>.Update.Set(n => n.Read, true));

    public async Task<bool> ExistsAsync(string userId, string type, string referenceId)
    {
        var filter = Builders<Notification>.Filter.And(
            Builders<Notification>.Filter.Eq(n => n.UserId, userId),
            Builders<Notification>.Filter.Eq(n => n.Type, type),
            Builders<Notification>.Filter.Eq(n => n.ReferenceId, referenceId));
        return await _col.Find(filter).AnyAsync();
    }
}
