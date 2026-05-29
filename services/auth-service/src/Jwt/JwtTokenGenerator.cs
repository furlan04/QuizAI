using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AuthService.Identity;
using AuthService.Keys;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Jwt;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly RsaKeyProvider _keys;
    private readonly IConfiguration _config;

    public JwtTokenGenerator(RsaKeyProvider keys, IConfiguration config)
    {
        _keys   = keys;
        _config = config;
    }

    public (string Token, DateTime ExpiresAt) Generate(AppUser user)
    {
        var expiresAt = DateTime.UtcNow.AddHours(
            int.Parse(_config["JWT_EXPIRY_HOURS"] ?? "24"));

        var signingKey  = new RsaSecurityKey(_keys.PrivateKey) { KeyId = _keys.Kid };
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.RsaSha256);

        var token = new JwtSecurityToken(
            issuer:   _config["JWT_ISSUER"]   ?? "quizai",
            audience: _config["JWT_AUDIENCE"] ?? "quizai",
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim("email",    user.Email!),
                new Claim("username", user.UserName!),
                new Claim(JwtRegisteredClaimNames.Iat,
                    DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                    ClaimValueTypes.Integer64),
            ],
            expires:           expiresAt,
            signingCredentials: credentials
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
