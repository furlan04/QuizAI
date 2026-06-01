namespace UserService.Users.Models.Dtos;

public record PublicProfileResponse(
    string UserId,
    string Username,
    string? AvatarUrl,
    string? Bio,
    DateTime CreatedAt
);
