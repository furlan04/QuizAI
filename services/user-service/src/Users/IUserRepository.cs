using UserService.Users.Models;

namespace UserService.Users;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByUsernameAsync(string username);
    Task UpsertAsync(User user);
    Task UpdateAsync(string id, string? bio, string? avatarUrl);
}
