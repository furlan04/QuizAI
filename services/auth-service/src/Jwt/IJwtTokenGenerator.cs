using AuthService.Identity;

namespace AuthService.Jwt;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAt) Generate(AppUser user);
}
