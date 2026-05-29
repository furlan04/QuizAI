using AuthService.Auth.Dtos;
using AuthService.Identity;
using AuthService.Jwt;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IJwtTokenGenerator _jwt;

    public AuthService(UserManager<AppUser> userManager, IJwtTokenGenerator jwt)
    {
        _userManager = userManager;
        _jwt         = jwt;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _userManager.FindByEmailAsync(request.Email) is not null)
            throw new ConflictException("Email già registrata.");

        if (await _userManager.FindByNameAsync(request.Username) is not null)
            throw new ConflictException("Username già in uso.");

        var user = new AppUser
        {
            UserName  = request.Username,
            Email     = request.Email,
            CreatedAt = DateTime.UtcNow,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new ConflictException(result.Errors.First().Description);

        var (token, expiresAt) = _jwt.Generate(user);
        return new AuthResponse(user.Id, user.UserName!, user.Email!, token, expiresAt);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new UnauthorizedException("Credenziali non valide.");

        if (!await _userManager.CheckPasswordAsync(user, request.Password))
            throw new UnauthorizedException("Credenziali non valide.");

        var (token, expiresAt) = _jwt.Generate(user);
        return new AuthResponse(user.Id, user.UserName!, user.Email!, token, expiresAt);
    }
}
