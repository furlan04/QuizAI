namespace AuthService.Auth;

public record GoogleUserInfo(string Subject, string Email, bool EmailVerified, string? Name);

public interface IGoogleTokenValidator
{
    /// <summary>Verifica l'ID token Google e ritorna le info utente, o lancia in caso di token non valido.</summary>
    Task<GoogleUserInfo> ValidateAsync(string idToken);
}
