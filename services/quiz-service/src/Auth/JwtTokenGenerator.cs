using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace QuizService.Auth;

public class JwtTokenGenerator
{
    private readonly IConfiguration _config;

    public JwtTokenGenerator(IConfiguration config) => _config = config;

    public string Generate(string userId, string email, string username)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["JWT_SECRET"]!));

        var token = new JwtSecurityToken(
            issuer: _config["JWT_ISSUER"],
            audience: _config["JWT_AUDIENCE"],
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim("email", email),
                new Claim("username", username),
            ],
            expires: DateTime.UtcNow.AddHours(
                int.Parse(_config["JWT_EXPIRY_HOURS"] ?? "24")),
            signingCredentials: new SigningCredentials(
                key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
