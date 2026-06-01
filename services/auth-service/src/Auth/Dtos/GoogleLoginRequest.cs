using System.ComponentModel.DataAnnotations;

namespace AuthService.Auth.Dtos;

public record GoogleLoginRequest(
    [Required] string IdToken
);
