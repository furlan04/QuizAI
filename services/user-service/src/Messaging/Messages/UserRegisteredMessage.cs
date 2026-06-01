namespace UserService.Messaging.Messages;

public record UserRegisteredMessage(
    string UserId,
    string Username,
    string Email
);
