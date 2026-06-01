using System.IdentityModel.Tokens.Jwt;
using AuthService.Identity;
using AuthService.Jwt;
using AuthService.Keys;
using Microsoft.Extensions.Configuration;

namespace AuthService.Tests.Auth;

public class JwtTokenGeneratorTests
{
    private readonly IJwtTokenGenerator _sut;
    private readonly RsaKeyProvider _keys;

    public JwtTokenGeneratorTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JWT_ISSUER"]       = "quizai",
                ["JWT_AUDIENCE"]     = "quizai",
                ["JWT_EXPIRY_HOURS"] = "1",
            })
            .Build();

        _keys = new RsaKeyProvider(config);
        _sut  = new JwtTokenGenerator(_keys, config);
    }

    [Fact]
    public void Generate_ReturnsValidJwt()
    {
        var user = new AppUser { Id = "u1", UserName = "alice", Email = "a@b.com" };

        var (token, expiresAt) = _sut.Generate(user);

        token.Should().NotBeNullOrEmpty();
        expiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public void Generate_TokenContainsExpectedClaims()
    {
        var user = new AppUser { Id = "user-123", UserName = "alice", Email = "alice@example.com" };

        var (token, _) = _sut.Generate(user);

        var handler = new JwtSecurityTokenHandler();
        var jwt     = handler.ReadJwtToken(token);

        jwt.Subject.Should().Be("user-123");
        jwt.Claims.Should().Contain(c => c.Type == "email"    && c.Value == "alice@example.com");
        jwt.Claims.Should().Contain(c => c.Type == "username" && c.Value == "alice");
        jwt.Issuer.Should().Be("quizai");
    }

    [Fact]
    public void Generate_TokenSignedWithRsa256()
    {
        var user = new AppUser { Id = "u1", UserName = "alice", Email = "a@b.com" };

        var (token, _) = _sut.Generate(user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Header.Alg.Should().Be("RS256");
    }

    [Fact]
    public void Generate_KidMatchesProvider()
    {
        var user = new AppUser { Id = "u1", UserName = "alice", Email = "a@b.com" };

        var (token, _) = _sut.Generate(user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Header.Kid.Should().Be(_keys.Kid);
    }
}
