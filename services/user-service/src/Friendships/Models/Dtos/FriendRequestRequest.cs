using System.ComponentModel.DataAnnotations;

namespace UserService.Friendships.Models.Dtos;

public record FriendRequestRequest([Required] string Username);

public record RespondFriendRequestRequest(
    [Required][RegularExpression("^(accept|reject)$")] string Action
);

public record FriendshipStatusResponse(string FriendshipId, string Status);

public record FriendResponse(
    string UserId, string Username, string? AvatarUrl, string? Bio);

public record FriendRequestResponse(
    string FriendshipId, string RequesterId, string Username, DateTime CreatedAt);

/// <summary>
/// Stato della relazione fra l'utente autenticato e un altro utente.
/// Status: "none" | "pending_sent" | "pending_received" | "accepted" | "self".
/// FriendshipId valorizzato quando esiste un documento friendship.
/// </summary>
public record FriendshipStatusDetail(string Status, string? FriendshipId);
