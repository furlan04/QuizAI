namespace QuizService.Messaging.Messages;

/// <summary>
/// Pubblicato quando un quiz è stato generato con successo ed è pronto all'uso.
/// Consumato da user-service per notificare gli amici del creatore.
/// </summary>
public record QuizCreatedMessage(
    string QuizId,
    string CreatorId,
    string CreatorUsername,
    string Title
);
