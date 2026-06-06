namespace AuthService.Auth.Dtos;

/// <summary>
/// Info utente restituite nel body di login/google/me.
/// Il JWT NON è più nel body: viene impostato come cookie httpOnly `access_token`.
/// </summary>
public record UserResponse(
    string UserId,
    string Username,
    string Email
);
