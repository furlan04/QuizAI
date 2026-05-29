using MassTransit;
using UserService.Challenges;
using UserService.Messaging.Messages;

namespace UserService.Messaging.Consumers;

public class QuizCompletedConsumer : IConsumer<QuizCompletedMessage>
{
    private readonly IChallengeRepository _challenges;
    private readonly ILogger<QuizCompletedConsumer> _logger;

    public QuizCompletedConsumer(
        IChallengeRepository challenges,
        ILogger<QuizCompletedConsumer> logger)
    {
        _challenges = challenges;
        _logger     = logger;
    }

    public async Task Consume(ConsumeContext<QuizCompletedMessage> context)
    {
        var msg = context.Message;
        _logger.LogInformation(
            "quiz.completed received: user={UserId} quiz={QuizId} score={Score}",
            msg.UserId, msg.QuizId, msg.Score);

        var challenge = await _challenges.GetAcceptedByUserAndQuizAsync(msg.UserId, msg.QuizId);
        if (challenge is null) return;

        var isChallenger = challenge.ChallengerId == msg.UserId;
        await _challenges.UpdateScoreAsync(challenge.Id, isChallenger, msg.Score);

        // Reload to check if both scores are now set
        var updated = await _challenges.GetByIdAsync(challenge.Id);
        if (updated?.ChallengerScore is not null && updated.ChallengedScore is not null)
        {
            string? winnerId = updated.ChallengerScore > updated.ChallengedScore
                ? updated.ChallengerId
                : updated.ChallengerScore < updated.ChallengedScore
                    ? updated.ChallengedId
                    : null;

            await _challenges.CompleteAsync(updated.Id, winnerId);
            _logger.LogInformation(
                "Challenge {ChallengeId} completed. Winner: {WinnerId}",
                updated.Id, winnerId ?? "draw");
        }
    }
}
