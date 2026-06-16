namespace UserService.Notifications.Models;

/// <summary>
/// Notifica in-app destinata a un singolo utente. Nessun invio via email in questa fase.
/// Type: "friend_request" | "quiz_created".
/// ReferenceId collega la notifica all'entità d'origine (friendshipId o quizId) e serve
/// alla deduplica idempotente in caso di riconsegna del messaggio.
/// </summary>
public class Notification
{
    public string Id { get; set; } = default!;
    public string UserId { get; set; } = default!;   // destinatario
    public string Type { get; set; } = default!;
    public bool Read { get; set; }
    public DateTime CreatedAt { get; set; }

    // Chi ha generato l'evento (mittente richiesta / creatore quiz)
    public string ActorId { get; set; } = default!;
    public string ActorUsername { get; set; } = default!;

    // Riferimento all'entità d'origine, usato per deduplica e navigazione
    public string ReferenceId { get; set; } = default!;

    // Payload specifico per "quiz_created"
    public string? QuizId { get; set; }
    public string? QuizTitle { get; set; }

    // Payload specifico per "friend_request"
    public string? FriendshipId { get; set; }
}
