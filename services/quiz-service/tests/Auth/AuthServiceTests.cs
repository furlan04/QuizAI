using FluentAssertions;
using Moq;
using QuizService.Auth;
using QuizService.Users;
using QuizService.Users.Models;
using Microsoft.Extensions.Configuration;

namespace QuizService.Tests.Auth;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly IAuthService _sut;

    public AuthServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JWT_SECRET"]       = "test_secret_that_is_long_enough_32c",
                ["JWT_ISSUER"]       = "quizai",
                ["JWT_AUDIENCE"]     = "quizai",
                ["JWT_EXPIRY_HOURS"] = "1",
            })
            .Build();

        _sut = new AuthService(_users.Object, new JwtTokenGenerator(config));
    }

    [Fact]
    public async Task Register_NewUser_ReturnsTokenAndUserInfo()
    {
        _users.Setup(r => r.ExistsByEmailAsync("a@b.com")).ReturnsAsync(false);
        _users.Setup(r => r.ExistsByUsernameAsync("alice")).ReturnsAsync(false);
        _users.Setup(r => r.CreateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

        var result = await _sut.RegisterAsync(
            new RegisterRequest("alice", "a@b.com", "secret123"));

        result.UserId.Should().Be("alice");
        result.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_DuplicateEmail_Throws()
    {
        _users.Setup(r => r.ExistsByEmailAsync("a@b.com")).ReturnsAsync(true);

        await _sut.Invoking(s =>
            s.RegisterAsync(new RegisterRequest("alice", "a@b.com", "pass")))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Email*");
    }

    [Fact]
    public async Task Register_DuplicateUsername_Throws()
    {
        _users.Setup(r => r.ExistsByEmailAsync("a@b.com")).ReturnsAsync(false);
        _users.Setup(r => r.ExistsByUsernameAsync("alice")).ReturnsAsync(true);

        await _sut.Invoking(s =>
            s.RegisterAsync(new RegisterRequest("alice", "a@b.com", "pass")))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Username*");
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("secret123");
        _users.Setup(r => r.GetByEmailAsync("a@b.com")).ReturnsAsync(new User
        {
            Id = "alice",
            Username = "alice",
            Email = "a@b.com",
            PasswordHash = hash,
            CreatedAt = DateTime.UtcNow,
        });

        var result = await _sut.LoginAsync(new LoginRequest("a@b.com", "secret123"));

        result.Token.Should().NotBeNullOrEmpty();
        result.UserId.Should().Be("alice");
    }

    [Fact]
    public async Task Login_WrongPassword_Throws()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("correct");
        _users.Setup(r => r.GetByEmailAsync("a@b.com")).ReturnsAsync(new User
        {
            Id = "alice", Username = "alice", Email = "a@b.com",
            PasswordHash = hash, CreatedAt = DateTime.UtcNow,
        });

        await _sut.Invoking(s =>
            s.LoginAsync(new LoginRequest("a@b.com", "wrong")))
            .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Login_UnknownEmail_Throws()
    {
        _users.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        await _sut.Invoking(s =>
            s.LoginAsync(new LoginRequest("x@x.com", "pass")))
            .Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
