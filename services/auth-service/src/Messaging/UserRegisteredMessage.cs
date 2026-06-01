namespace AuthService.Messaging;

public record UserRegisteredMessage(
    string UserId,
    string Username,
    string Email
);
