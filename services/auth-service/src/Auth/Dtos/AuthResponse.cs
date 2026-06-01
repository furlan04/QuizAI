namespace AuthService.Auth.Dtos;

public record AuthResponse(
    string UserId,
    string Username,
    string Email,
    string Token,
    DateTime ExpiresAt
);
