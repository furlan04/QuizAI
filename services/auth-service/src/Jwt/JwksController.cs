using System.Security.Cryptography;
using AuthService.Keys;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Jwt;

[ApiController]
public class JwksController : ControllerBase
{
    private readonly RsaKeyProvider _keys;
    private readonly IConfiguration _config;

    public JwksController(RsaKeyProvider keys, IConfiguration config)
    {
        _keys   = keys;
        _config = config;
    }

    /// <summary>Chiave pubblica RSA in formato JWKS (usata dagli altri servizi per validare i token).</summary>
    [HttpGet("auth/.well-known/jwks.json")]
    public IActionResult GetJwks()
    {
        var parameters = _keys.PublicKey.ExportParameters(includePrivateParameters: false);

        return Ok(new
        {
            keys = new[]
            {
                new
                {
                    kty = "RSA",
                    use = "sig",
                    alg = "RS256",
                    kid = _keys.Kid,
                    n   = Base64UrlEncoder.Encode(parameters.Modulus!),
                    e   = Base64UrlEncoder.Encode(parameters.Exponent!),
                }
            }
        });
    }

    /// <summary>Minimal OIDC discovery — consente agli altri servizi di usare options.Authority.</summary>
    [HttpGet(".well-known/openid-configuration")]
    public IActionResult GetDiscovery()
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        return Ok(new
        {
            issuer   = _config["JWT_ISSUER"] ?? "quizai",
            jwks_uri = $"{baseUrl}/auth/.well-known/jwks.json",
        });
    }
}
