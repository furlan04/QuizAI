using QuizService.Users;
using QuizService.Users.Models;

namespace QuizService.Auth;

public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly JwtTokenGenerator _jwt;

    public AuthService(IUserRepository users, JwtTokenGenerator jwt)
    {
        _users = users;
        _jwt = jwt;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _users.ExistsByEmailAsync(request.Email))
            throw new InvalidOperationException("Email already registered.");

        if (await _users.ExistsByUsernameAsync(request.Username))
            throw new InvalidOperationException("Username already taken.");

        var user = new User
        {
            Id = request.Username,
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow,
        };

        await _users.CreateAsync(user);

        return new AuthResponse(
            user.Id, user.Username, user.Email,
            _jwt.Generate(user.Id, user.Email, user.Username));
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _users.GetByEmailAsync(request.Email)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        return new AuthResponse(
            user.Id, user.Username, user.Email,
            _jwt.Generate(user.Id, user.Email, user.Username));
    }
}
