using System.ComponentModel.DataAnnotations;

namespace AuthService.Auth.Dtos;

public record RegisterRequest(
    [Required]
    [StringLength(20, MinimumLength = 3, ErrorMessage = "Username deve essere tra 3 e 20 caratteri")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Solo caratteri alfanumerici e underscore")]
    string Username,

    [Required]
    [EmailAddress(ErrorMessage = "Formato email non valido")]
    string Email,

    [Required]
    [MinLength(8, ErrorMessage = "Password di almeno 8 caratteri")]
    [RegularExpression(@"^(?=.*\d).+$", ErrorMessage = "La password deve contenere almeno un numero")]
    string Password
);
