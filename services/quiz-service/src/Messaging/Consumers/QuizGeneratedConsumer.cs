using MassTransit;
using QuizService.Messaging.Messages;
using QuizService.Messaging.Publishers;
using QuizService.Quizzes;
using QuizService.Quizzes.Models;

namespace QuizService.Messaging.Consumers;

public class QuizGeneratedConsumer : IConsumer<QuizGeneratedMessage>
{
    private readonly IQuizRepository _quizzes;
    private readonly IQuizCreatedPublisher _quizCreated;
    private readonly ILogger<QuizGeneratedConsumer> _logger;

    public QuizGeneratedConsumer(
        IQuizRepository quizzes,
        IQuizCreatedPublisher quizCreated,
        ILogger<QuizGeneratedConsumer> logger)
    {
        _quizzes = quizzes;
        _quizCreated = quizCreated;
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

        // Solo quando il quiz è effettivamente pronto annunciamo la creazione:
        // user-service ne notificherà gli amici del creatore.
        if (msg.Status == "ready")
        {
            var quiz = await _quizzes.GetByIdAsync(msg.QuizId);
            if (quiz is not null)
            {
                await _quizCreated.PublishAsync(new QuizCreatedMessage(
                    quiz.Id, quiz.CreatedBy, quiz.CreatedByUsername, quiz.Title));
            }
            else
            {
                _logger.LogWarning(
                    "quiz.generated ready ma quiz {QuizId} non trovato: notifica saltata",
                    msg.QuizId);
            }
        }
    }
}
