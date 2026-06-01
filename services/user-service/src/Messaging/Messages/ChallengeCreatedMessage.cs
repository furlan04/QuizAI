namespace UserService.Messaging.Messages;

public record ChallengeCreatedMessage(
    string ChallengeId,
    string ChallengerId,
    string ChallengedId,
    string QuizId
);
