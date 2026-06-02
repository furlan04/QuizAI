using UserService.Users.Models;
using UserService.Users.Models.Dtos;

namespace UserService.Users;

public class UserService : IUserService
{
    private readonly IUserRepository _repo;

    public UserService(IUserRepository repo) => _repo = repo;

    public async Task<User> GetOrCreateAsync(string userId, string email, string username)
    {
        var existing = await _repo.GetByIdAsync(userId);
        if (existing is not null) return existing;

        var user = new User
        {
            Id        = userId,
            Username  = username,
            Email     = email,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        try
        {
            await _repo.UpsertAsync(user);
            return user;
        }
        catch (MongoDB.Driver.MongoWriteException)
        {
            // Creato in concorrenza (es. dal consumer user.registered): rileggi
            return await _repo.GetByIdAsync(userId) ?? user;
        }
    }

    public async Task<User> UpdateAsync(string userId, UpdateProfileRequest request)
    {
        await _repo.UpdateAsync(userId, request.Bio, request.AvatarUrl);
        return await _repo.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");
    }

    public async Task<PublicProfileResponse> GetPublicProfileAsync(string username)
    {
        var user = await _repo.GetByUsernameAsync(username)
            ?? throw new KeyNotFoundException($"User '{username}' not found.");

        return new PublicProfileResponse(
            user.Id, user.Username, user.AvatarUrl, user.Bio, user.CreatedAt);
    }

    public async Task<PublicProfileResponse> GetPublicProfileByIdAsync(string userId)
    {
        var user = await _repo.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException($"User '{userId}' not found.");

        return new PublicProfileResponse(
            user.Id, user.Username, user.AvatarUrl, user.Bio, user.CreatedAt);
    }
}
