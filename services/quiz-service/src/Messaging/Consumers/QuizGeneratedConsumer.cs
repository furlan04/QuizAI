using MassTransit;
using QuizService.Messaging.Messages;
using QuizService.Quizzes;
using QuizService.Quizzes.Models;

namespace QuizService.Messaging.Consumers;

public class QuizGeneratedConsumer : IConsumer<QuizGeneratedMessage>
{
    private readonly IQuizRepository _quizzes;
    private readonly ILogger<QuizGeneratedConsumer> _logger;

    public QuizGeneratedConsumer(IQuizRepository quizzes, ILogger<QuizGeneratedConsumer> logger)
    {
        _quizzes = quizzes;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<QuizGeneratedMessage> context)
    {
        var msg = context.Message;
        _logger.LogInformation(
            "Received quiz.generated for quiz_id={QuizId} status={Status}",
            msg.QuizId, msg.Status);

        List<Question>? questions = null;
        if (msg.Status == "ready" && msg.Questions?.Count > 0)
        {
            questions = msg.Questions.Select(q => new Question
            {
                Text = q.Text,
                Options = q.Options,
                CorrectIndex = q.CorrectIndex,
                Explanation = q.Explanation,
            }).ToList();
        }

        await _quizzes.UpdateFromGeneratedAsync(
            msg.QuizId,
            msg.Status,
            questions,
            msg.Tags,
            msg.Error);
    }
}
