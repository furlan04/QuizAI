namespace AuthService.Auth;

/// <summary>
/// Punto unico per nome e opzioni del cookie di autenticazione.
/// Il token JWT viaggia in un cookie httpOnly: non è leggibile da JavaScript,
/// così è immune al furto via XSS. Gli altri servizi lo leggono dal cookie.
/// </summary>
public static class AuthCookie
{
    public const string Name = "access_token";

    /// <summary>Opzioni per impostare il cookie alla login.</summary>
    public static CookieOptions Build(bool secure, DateTimeOffset expires) =>
        WithCommon(new CookieOptions { Expires = expires }, secure);

    /// <summary>Opzioni per cancellare il cookie al logout (devono combaciare con quelle di set).</summary>
    public static CookieOptions BuildForDelete(bool secure) =>
        WithCommon(new CookieOptions(), secure);

    private static CookieOptions WithCommon(CookieOptions options, bool secure)
    {
        options.HttpOnly = true;
        // Secure richiede HTTPS: attivo in produzione (https), disattivo dove si serve
        // ancora in http (sviluppo locale, stack docker su localhost).
        options.Secure   = secure;
        options.SameSite = SameSiteMode.Strict;
        options.Path     = "/";
        return options;
    }
}
