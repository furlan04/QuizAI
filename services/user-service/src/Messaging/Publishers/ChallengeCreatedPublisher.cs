using MassTransit;
using UserService.Messaging.Messages;

namespace UserService.Messaging.Publishers;

public interface IChallengeCreatedPublisher
{
    Task PublishAsync(ChallengeCreatedMessage message);
}

public class ChallengeCreatedPublisher : IChallengeCreatedPublisher
{
    private readonly ISendEndpointProvider _sendEndpoints;

    public ChallengeCreatedPublisher(ISendEndpointProvider sendEndpoints)
        => _sendEndpoints = sendEndpoints;

    public async Task PublishAsync(ChallengeCreatedMessage message)
    {
        var endpoint = await _sendEndpoints.GetSendEndpoint(
            new Uri("queue:challenge.created"));
        await endpoint.Send(message);
    }
}
