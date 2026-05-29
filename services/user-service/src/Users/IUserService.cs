using UserService.Users.Models;
using UserService.Users.Models.Dtos;

namespace UserService.Users;

public interface IUserService
{
    Task<User> GetOrCreateAsync(string userId, string email, string username);
    Task<User> UpdateAsync(string userId, UpdateProfileRequest request);
    Task<PublicProfileResponse> GetPublicProfileAsync(string username);
}
