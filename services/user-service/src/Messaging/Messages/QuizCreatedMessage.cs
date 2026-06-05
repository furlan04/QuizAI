namespace UserService.Messaging.Messages;

/// <summary>
/// Ricevuto da quiz-service quando un quiz è pronto. Campi wire in snake_case
/// (quiz_id, creator_id, creator_username, title).
/// </summary>
public record QuizCreatedMessage(
    string QuizId,
    string CreatorId,
    string CreatorUsername,
    string Title
);
