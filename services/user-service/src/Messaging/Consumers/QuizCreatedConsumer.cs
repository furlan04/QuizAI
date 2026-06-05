using MassTransit;
using UserService.Messaging.Messages;
using UserService.Notifications;

namespace UserService.Messaging.Consumers;

public class QuizCreatedConsumer : IConsumer<QuizCreatedMessage>
{
    private readonly INotificationService _notifications;
    private readonly ILogger<QuizCreatedConsumer> _logger;

    public QuizCreatedConsumer(
        INotificationService notifications,
        ILogger<QuizCreatedConsumer> logger)
    {
        _notifications = notifications;
        _logger        = logger;
    }

    public async Task Consume(ConsumeContext<QuizCreatedMessage> context)
    {
        var msg = context.Message;
        _logger.LogInformation(
            "quiz.created received: quiz={QuizId} creator={CreatorId}",
            msg.QuizId, msg.CreatorId);

        await _notifications.CreateQuizNotificationsAsync(
            msg.CreatorId, msg.CreatorUsername, msg.QuizId, msg.Title);
    }
}
