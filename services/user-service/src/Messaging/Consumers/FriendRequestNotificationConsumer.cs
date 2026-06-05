using MassTransit;
using UserService.Messaging.Messages;
using UserService.Notifications;

namespace UserService.Messaging.Consumers;

public class FriendRequestNotificationConsumer : IConsumer<FriendRequestSentMessage>
{
    private readonly INotificationService _notifications;
    private readonly ILogger<FriendRequestNotificationConsumer> _logger;

    public FriendRequestNotificationConsumer(
        INotificationService notifications,
        ILogger<FriendRequestNotificationConsumer> logger)
    {
        _notifications = notifications;
        _logger        = logger;
    }

    public async Task Consume(ConsumeContext<FriendRequestSentMessage> context)
    {
        var msg = context.Message;
        _logger.LogInformation(
            "friend.request.sent received: friendship={FriendshipId} from={RequesterId} to={AddresseeId}",
            msg.FriendshipId, msg.RequesterId, msg.AddresseeId);

        await _notifications.CreateFriendRequestNotificationAsync(
            msg.AddresseeId, msg.RequesterId, msg.FriendshipId);
    }
}
