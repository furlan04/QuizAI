using QuizService.Users.Models;

namespace QuizService.Users;

public interface IUserRepository
{
    Task CreateAsync(User user);
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByEmailAsync(string email);
    Task<bool> ExistsByEmailAsync(string email);
    Task<bool> ExistsByUsernameAsync(string username);
}
