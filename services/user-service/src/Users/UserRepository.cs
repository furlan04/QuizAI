using MongoDB.Driver;
using UserService.Users.Models;

namespace UserService.Users;

public class UserRepository : IUserRepository
{
    private readonly IMongoCollection<User> _col;

    public UserRepository(IMongoDatabase db)
        => _col = db.GetCollection<User>("users");

    public Task<User?> GetByIdAsync(string id) =>
        _col.Find(u => u.Id == id).FirstOrDefaultAsync()!;

    public Task<User?> GetByUsernameAsync(string username) =>
        _col.Find(u => u.Username == username).FirstOrDefaultAsync()!;

    public async Task UpsertAsync(User user)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, user.Id);
        await _col.ReplaceOneAsync(filter, user, new ReplaceOptions { IsUpsert = true });
    }

    public Task UpdateAsync(string id, string? bio, string? avatarUrl)
    {
        var updates = new List<UpdateDefinition<User>>
        {
            Builders<User>.Update.Set(u => u.UpdatedAt, DateTime.UtcNow),
        };
        if (bio is not null)       updates.Add(Builders<User>.Update.Set(u => u.Bio, bio));
        if (avatarUrl is not null) updates.Add(Builders<User>.Update.Set(u => u.AvatarUrl, avatarUrl));

        return _col.UpdateOneAsync(u => u.Id == id,
            Builders<User>.Update.Combine(updates));
    }
}
