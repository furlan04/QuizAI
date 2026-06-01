namespace UserService.Messaging.Messages;

public record QuizCompletedMessage(
    string QuizId,
    string UserId,
    int Score
);
