namespace QuizService.Messaging.Messages;

public record QuizGenerateMessage(
    string QuizId,
    string Topic,
    string Difficulty,
    int NumQuestions,
    string UserId
);
