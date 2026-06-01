using System.ComponentModel.DataAnnotations;

namespace AuthService.Auth.Dtos;

public record LoginRequest(
    [Required, EmailAddress]
    string Email,

    [Required]
    string Password
);
