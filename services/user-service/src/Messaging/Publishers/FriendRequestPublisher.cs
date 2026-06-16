using MassTransit;
using UserService.Messaging.Messages;

namespace UserService.Messaging.Publishers;

public interface IFriendRequestPublisher
{
    Task PublishAsync(FriendRequestSentMessage message);
}

public class FriendRequestPublisher : IFriendRequestPublisher
{
    private readonly ISendEndpointProvider _sendEndpoints;

    public FriendRequestPublisher(ISendEndpointProvider sendEndpoints)
        => _sendEndpoints = sendEndpoints;

    public async Task PublishAsync(FriendRequestSentMessage message)
    {
        var endpoint = await _sendEndpoints.GetSendEndpoint(
            new Uri("queue:friend.request.sent"));
        await endpoint.Send(message);
    }
}
