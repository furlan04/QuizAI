namespace QuizService.Messaging.Messages;

public record QuizGeneratedMessage(
    string QuizId,
    string Status,
    List<GeneratedQuestion> Questions,
    List<string> Tags,
    string? Error
);

public record GeneratedQuestion(
    string Text,
    List<string> Options,
    int CorrectIndex,
    string Explanation
);
