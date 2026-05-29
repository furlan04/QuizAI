using AuthService.Auth;
using AuthService.Auth.Dtos;
using AuthService.Identity;
using AuthService.Jwt;
using AuthService.Messaging;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace AuthService.Tests.Auth;

public class AuthServiceTests
{
    private readonly Mock<UserManager<AppUser>> _userManager;
    private readonly Mock<IJwtTokenGenerator> _jwt = new();
    private readonly Mock<IUserRegisteredPublisher> _publisher = new();
    private readonly IAuthService _sut;

    public AuthServiceTests()
    {
        var store = new Mock<IUserStore<AppUser>>();
        _userManager = new Mock<UserManager<AppUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _jwt.Setup(j => j.Generate(It.IsAny<AppUser>()))
            .Returns(("tok", DateTime.UtcNow.AddHours(24)));

        _sut = new AuthService.Auth.AuthService(_userManager.Object, _jwt.Object, _publisher.Object);
    }

    [Fact]
    public async Task Register_NewUser_Returns201WithToken()
    {
        _userManager.Setup(m => m.FindByEmailAsync("a@b.com"))
            .ReturnsAsync((AppUser?)null);
        _userManager.Setup(m => m.FindByNameAsync("alice"))
            .ReturnsAsync((AppUser?)null);
        _userManager.Setup(m => m.CreateAsync(It.IsAny<AppUser>(), "Secret1"))
            .ReturnsAsync(IdentityResult.Success);

        var result = await _sut.RegisterAsync(
            new RegisterRequest("alice", "a@b.com", "Secret1"));

        result.Token.Should().Be("tok");
        result.Username.Should().Be("alice");
    }

    [Fact]
    public async Task Register_DuplicateEmail_ThrowsConflict()
    {
        _userManager.Setup(m => m.FindByEmailAsync("a@b.com"))
            .ReturnsAsync(new AppUser { Email = "a@b.com" });

        await _sut.Invoking(s =>
            s.RegisterAsync(new RegisterRequest("alice", "a@b.com", "Secret1")))
            .Should().ThrowAsync<ConflictException>()
            .WithMessage("*Email*");
    }

    [Fact]
    public async Task Register_DuplicateUsername_ThrowsConflict()
    {
        _userManager.Setup(m => m.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((AppUser?)null);
        _userManager.Setup(m => m.FindByNameAsync("alice"))
            .ReturnsAsync(new AppUser { UserName = "alice" });

        await _sut.Invoking(s =>
            s.RegisterAsync(new RegisterRequest("alice", "x@x.com", "Secret1")))
            .Should().ThrowAsync<ConflictException>()
            .WithMessage("*Username*");
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        var user = new AppUser { Id = "u1", UserName = "alice", Email = "a@b.com" };
        _userManager.Setup(m => m.FindByEmailAsync("a@b.com")).ReturnsAsync(user);
        _userManager.Setup(m => m.CheckPasswordAsync(user, "Secret1")).ReturnsAsync(true);

        var result = await _sut.LoginAsync(new LoginRequest("a@b.com", "Secret1"));

        result.Token.Should().Be("tok");
    }

    [Fact]
    public async Task Login_WrongPassword_ThrowsUnauthorized()
    {
        var user = new AppUser { Email = "a@b.com" };
        _userManager.Setup(m => m.FindByEmailAsync("a@b.com")).ReturnsAsync(user);
        _userManager.Setup(m => m.CheckPasswordAsync(user, "wrong")).ReturnsAsync(false);

        await _sut.Invoking(s =>
            s.LoginAsync(new LoginRequest("a@b.com", "wrong")))
            .Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task Login_UnknownEmail_ThrowsUnauthorized()
    {
        _userManager.Setup(m => m.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((AppUser?)null);

        await _sut.Invoking(s =>
            s.LoginAsync(new LoginRequest("x@x.com", "pass")))
            .Should().ThrowAsync<UnauthorizedException>();
    }
}
