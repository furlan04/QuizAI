using MassTransit;
using QuizService.Messaging.Messages;

namespace QuizService.Messaging.Publishers;

public interface IQuizGenerationPublisher
{
    Task PublishAsync(QuizGenerateMessage message);
}

public class QuizGenerationPublisher : IQuizGenerationPublisher
{
    private readonly ISendEndpointProvider _sendEndpoints;

    public QuizGenerationPublisher(ISendEndpointProvider sendEndpoints)
        => _sendEndpoints = sendEndpoints;

    public async Task PublishAsync(QuizGenerateMessage message)
    {
        var endpoint = await _sendEndpoints.GetSendEndpoint(
            new Uri("queue:quiz.generate"));
        await endpoint.Send(message);
    }
}
