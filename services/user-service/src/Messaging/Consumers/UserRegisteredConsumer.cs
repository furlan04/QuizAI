using MassTransit;
using UserService.Messaging.Messages;
using UserService.Users;
using UserService.Users.Models;

namespace UserService.Messaging.Consumers;

public class UserRegisteredConsumer : IConsumer<UserRegisteredMessage>
{
    private readonly IUserRepository _users;
    private readonly ILogger<UserRegisteredConsumer> _logger;

    public UserRegisteredConsumer(IUserRepository users, ILogger<UserRegisteredConsumer> logger)
    {
        _users = users;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<UserRegisteredMessage> context)
    {
        var msg = context.Message;

        if (await _users.GetByIdAsync(msg.UserId) is not null)
            return; // già presente, idempotente

        await _users.UpsertAsync(new User
        {
            Id        = msg.UserId,
            Username  = msg.Username,
            Email     = msg.Email,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });

        _logger.LogInformation("Profilo creato per user_id={UserId} username={Username}",
            msg.UserId, msg.Username);
    }
}
