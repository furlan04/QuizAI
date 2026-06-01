using System.ComponentModel.DataAnnotations;

namespace AuthService.Auth.Dtos;

public record ResendConfirmationRequest(
    [Required, EmailAddress] string Email
);
