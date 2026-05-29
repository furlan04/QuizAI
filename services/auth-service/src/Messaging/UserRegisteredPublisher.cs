using MassTransit;

namespace AuthService.Messaging;

public interface IUserRegisteredPublisher
{
    Task PublishAsync(UserRegisteredMessage message);
}

public class UserRegisteredPublisher : IUserRegisteredPublisher
{
    private readonly ISendEndpointProvider _sendEndpoints;

    public UserRegisteredPublisher(ISendEndpointProvider sendEndpoints)
        => _sendEndpoints = sendEndpoints;

    public async Task PublishAsync(UserRegisteredMessage message)
    {
        var endpoint = await _sendEndpoints.GetSendEndpoint(new Uri("queue:user.registered"));
        await endpoint.Send(message);
    }
}
