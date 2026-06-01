using Google.Apis.Auth;

namespace AuthService.Auth;

public class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly IConfiguration _config;
    public GoogleTokenValidator(IConfiguration config) => _config = config;

    public async Task<GoogleUserInfo> ValidateAsync(string idToken)
    {
        var clientId = _config["GOOGLE_CLIENT_ID"]
            ?? throw new InvalidOperationException("GOOGLE_CLIENT_ID non configurato.");

        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { clientId },
        };

        var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        return new GoogleUserInfo(
            payload.Subject,
            payload.Email,
            payload.EmailVerified,
            payload.Name);
    }
}
