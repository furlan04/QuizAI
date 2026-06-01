using MongoDB.Driver;
using QuizService.Users.Models;

namespace QuizService.Users;

public class UserRepository : IUserRepository
{
    private readonly IMongoCollection<User> _col;

    public UserRepository(IMongoDatabase db)
        => _col = db.GetCollection<User>("users");

    public Task CreateAsync(User user) => _col.InsertOneAsync(user);

    public Task<User?> GetByIdAsync(string id) =>
        _col.Find(u => u.Id == id).FirstOrDefaultAsync()!;

    public Task<User?> GetByEmailAsync(string email) =>
        _col.Find(u => u.Email == email).FirstOrDefaultAsync()!;

    public async Task<bool> ExistsByEmailAsync(string email) =>
        await _col.Find(u => u.Email == email).AnyAsync();

    public async Task<bool> ExistsByUsernameAsync(string username) =>
        await _col.Find(u => u.Id == username).AnyAsync();
}
