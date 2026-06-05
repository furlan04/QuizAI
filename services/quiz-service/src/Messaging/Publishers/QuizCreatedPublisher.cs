using MassTransit;
using QuizService.Messaging.Messages;

namespace QuizService.Messaging.Publishers;

public interface IQuizCreatedPublisher
{
    Task PublishAsync(QuizCreatedMessage message);
}

public class QuizCreatedPublisher : IQuizCreatedPublisher
{
    private readonly ISendEndpointProvider _sendEndpoints;

    public QuizCreatedPublisher(ISendEndpointProvider sendEndpoints)
        => _sendEndpoints = sendEndpoints;

    public async Task PublishAsync(QuizCreatedMessage message)
    {
        var endpoint = await _sendEndpoints.GetSendEndpoint(
            new Uri("queue:quiz.created"));
        await endpoint.Send(message);
    }
}
