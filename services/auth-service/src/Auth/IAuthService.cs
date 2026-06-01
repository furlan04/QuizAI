using AuthService.Auth.Dtos;

namespace AuthService.Auth;

public class ConflictException : Exception
{
    public string Code { get; }
    public ConflictException(string code, string message) : base(message) => Code = code;
}

public class UnauthorizedException : Exception
{
    public string Code { get; }
    public UnauthorizedException(string code, string message) : base(message) => Code = code;
}

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task ConfirmEmailAsync(ConfirmEmailRequest request);
    Task ResendConfirmationAsync(ResendConfirmationRequest request);
    Task<AuthResponse> LoginWithGoogleAsync(GoogleLoginRequest request);
}
