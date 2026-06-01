using System.ComponentModel.DataAnnotations;

namespace AuthService.Auth.Dtos;

public record ConfirmEmailRequest(
    [Required] string UserId,
    [Required] string Token
);
