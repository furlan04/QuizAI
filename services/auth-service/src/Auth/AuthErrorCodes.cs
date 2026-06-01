namespace AuthService.Auth;

/// <summary>
/// Codici stabili degli errori auth. I client li usano per decidere comportamento
/// (es. mostrare il pulsante "reinvia email") e per la localizzazione dei messaggi.
/// I valori non vanno mai cambiati: aggiungerne di nuovi è ok.
/// </summary>
public static class AuthErrorCodes
{
    // 401 — login / token
    public const string InvalidCredentials       = "invalid_credentials";
    public const string EmailNotConfirmed        = "email_not_confirmed";
    public const string InvalidConfirmationToken = "invalid_confirmation_token";
    public const string UserNotFound             = "user_not_found";

    // 401 — Google
    public const string InvalidGoogleToken       = "invalid_google_token";
    public const string GoogleEmailNotVerified   = "google_email_not_verified";
    public const string GoogleAccountCreateFailed = "google_account_create_failed";

    // 409 — registrazione
    public const string EmailAlreadyRegistered   = "email_already_registered";
    public const string UsernameAlreadyTaken     = "username_already_taken";
    public const string PasswordRejected         = "password_rejected";
}
