namespace UserService.Messaging.Messages;

/// <summary>
/// Emesso quando un utente invia una richiesta d'amicizia. Consumato all'interno
/// dello stesso servizio per generare la notifica in-app al destinatario.
/// </summary>
public record FriendRequestSentMessage(
    string FriendshipId,
    string RequesterId,
    string AddresseeId
);
