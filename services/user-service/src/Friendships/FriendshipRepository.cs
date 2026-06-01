using MongoDB.Bson;
using MongoDB.Driver;
using UserService.Friendships.Models;

namespace UserService.Friendships;

public class FriendshipRepository : IFriendshipRepository
{
    private readonly IMongoCollection<Friendship> _col;

    public FriendshipRepository(IMongoDatabase db)
        => _col = db.GetCollection<Friendship>("friendships");

    public async Task<string> CreateAsync(Friendship friendship)
    {
        await _col.InsertOneAsync(friendship);
        return friendship.Id;
    }

    public Task<Friendship?> GetByIdAsync(string id)
    {
        if (!ObjectId.TryParse(id, out _)) return Task.FromResult<Friendship?>(null);
        return _col.Find(f => f.Id == id).FirstOrDefaultAsync()!;
    }

    public Task<Friendship?> GetBetweenUsersAsync(string userId1, string userId2)
    {
        var filter = Builders<Friendship>.Filter.Or(
            Builders<Friendship>.Filter.And(
                Builders<Friendship>.Filter.Eq(f => f.RequesterId, userId1),
                Builders<Friendship>.Filter.Eq(f => f.AddresseeId, userId2)),
            Builders<Friendship>.Filter.And(
                Builders<Friendship>.Filter.Eq(f => f.RequesterId, userId2),
                Builders<Friendship>.Filter.Eq(f => f.AddresseeId, userId1)));
        return _col.Find(filter).FirstOrDefaultAsync()!;
    }

    public Task<List<Friendship>> GetAcceptedAsync(string userId)
    {
        var filter = Builders<Friendship>.Filter.And(
            Builders<Friendship>.Filter.Eq(f => f.Status, "accepted"),
            Builders<Friendship>.Filter.Or(
                Builders<Friendship>.Filter.Eq(f => f.RequesterId, userId),
                Builders<Friendship>.Filter.Eq(f => f.AddresseeId, userId)));
        return _col.Find(filter).ToListAsync();
    }

    public Task<List<Friendship>> GetPendingIncomingAsync(string userId) =>
        _col.Find(f => f.AddresseeId == userId && f.Status == "pending").ToListAsync();

    public Task UpdateStatusAsync(string id, string status) =>
        _col.UpdateOneAsync(f => f.Id == id,
            Builders<Friendship>.Update
                .Set(f => f.Status, status)
                .Set(f => f.UpdatedAt, DateTime.UtcNow));

    public Task DeleteBetweenUsersAsync(string userId1, string userId2)
    {
        var filter = Builders<Friendship>.Filter.Or(
            Builders<Friendship>.Filter.And(
                Builders<Friendship>.Filter.Eq(f => f.RequesterId, userId1),
                Builders<Friendship>.Filter.Eq(f => f.AddresseeId, userId2)),
            Builders<Friendship>.Filter.And(
                Builders<Friendship>.Filter.Eq(f => f.RequesterId, userId2),
                Builders<Friendship>.Filter.Eq(f => f.AddresseeId, userId1)));
        return _col.DeleteOneAsync(filter);
    }

    public async Task<bool> AreFriendsAsync(string userId1, string userId2)
    {
        var filter = Builders<Friendship>.Filter.And(
            Builders<Friendship>.Filter.Eq(f => f.Status, "accepted"),
            Builders<Friendship>.Filter.Or(
                Builders<Friendship>.Filter.And(
                    Builders<Friendship>.Filter.Eq(f => f.RequesterId, userId1),
                    Builders<Friendship>.Filter.Eq(f => f.AddresseeId, userId2)),
                Builders<Friendship>.Filter.And(
                    Builders<Friendship>.Filter.Eq(f => f.RequesterId, userId2),
                    Builders<Friendship>.Filter.Eq(f => f.AddresseeId, userId1))));
        return await _col.Find(filter).AnyAsync();
    }
}
