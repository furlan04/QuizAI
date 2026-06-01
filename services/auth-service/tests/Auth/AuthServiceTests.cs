using AuthService.Auth;
using AuthService.Auth.Dtos;
using AuthService.Email;
using AuthService.Identity;
using AuthService.Jwt;
using AuthService.Messaging;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;

namespace AuthService.Tests.Auth;

public class AuthServiceTests
{
    private readonly Mock<UserManager<AppUser>> _userManager;
    private readonly Mock<IJwtTokenGenerator> _jwt = new();
    private readonly Mock<IUserRegisteredPublisher> _publisher = new();
    private readonly Mock<IEmailSender> _email = new();
    private readonly Mock<IGoogleTokenValidator> _google = new();
    private readonly IAuthService _sut;

    public AuthServiceTests()
    {
        var store = new Mock<IUserStore<AppUser>>();
        _userManager = new Mock<UserManager<AppUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _jwt.Setup(j => j.Generate(It.IsAny<AppUser>()))
            .Returns(("tok", DateTime.UtcNow.AddHours(24)));

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FRONTEND_URL"] = "http://localhost:3000",
            }).Build();

        _sut = new AuthService.Auth.AuthService(
            _userManager.Object, _jwt.Object, _publisher.Object,
            _email.Object, _google.Object, config);
    }

    [Fact]
    public async Task Register_NewUser_SendsConfirmationEmail()
    {
        _userManager.Setup(m => m.FindByEmailAsync("a@b.com")).ReturnsAsync((AppUser?)null);
        _userManager.Setup(m => m.FindByNameAsync("alice")).ReturnsAsync((AppUser?)null);
        _userManager.Setup(m => m.CreateAsync(It.IsAny<AppUser>(), "Secret1"))
            .ReturnsAsync(IdentityResult.Success);
        _userManager.Setup(m => m.GenerateEmailConfirmationTokenAsync(It.IsAny<AppUser>()))
            .ReturnsAsync("rawtoken");

        var result = await _sut.RegisterAsync(new RegisterRequest("alice", "a@b.com", "Secret1"));

        result.Message.Should().Contain("email");
        _email.Verify(e => e.SendAsync("a@b.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        _publisher.Verify(p => p.PublishAsync(It.IsAny<UserRegisteredMessage>()), Times.Once);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ThrowsConflict()
    {
        _userManager.Setup(m => m.FindByEmailAsync("a@b.com"))
            .ReturnsAsync(new AppUser { Email = "a@b.com" });

        await _sut.Invoking(s => s.RegisterAsync(new RegisterRequest("alice", "a@b.com", "Secret1")))
            .Should().ThrowAsync<ConflictException>().WithMessage("*Email*");
    }

    [Fact]
    public async Task Register_DuplicateUsername_ThrowsConflict()
    {
        _userManager.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((AppUser?)null);
        _userManager.Setup(m => m.FindByNameAsync("alice")).ReturnsAsync(new AppUser { UserName = "alice" });

        await _sut.Invoking(s => s.RegisterAsync(new RegisterRequest("alice", "x@x.com", "Secret1")))
            .Should().ThrowAsync<ConflictException>().WithMessage("*Username*");
    }

    [Fact]
    public async Task Login_EmailNotConfirmed_ThrowsUnauthorized()
    {
        var user = new AppUser { Email = "a@b.com", EmailConfirmed = false };
        _userManager.Setup(m => m.FindByEmailAsync("a@b.com")).ReturnsAsync(user);
        _userManager.Setup(m => m.CheckPasswordAsync(user, "Secret1")).ReturnsAsync(true);

        await _sut.Invoking(s => s.LoginAsync(new LoginRequest("a@b.com", "Secret1")))
            .Should().ThrowAsync<UnauthorizedException>().WithMessage("*confermata*");
    }

    [Fact]
    public async Task Login_ValidConfirmedUser_ReturnsToken()
    {
        var user = new AppUser
        {
            Id = "u1", UserName = "alice", Email = "a@b.com", EmailConfirmed = true,
        };
        _userManager.Setup(m => m.FindByEmailAsync("a@b.com")).ReturnsAsync(user);
        _userManager.Setup(m => m.CheckPasswordAsync(user, "Secret1")).ReturnsAsync(true);

        var result = await _sut.LoginAsync(new LoginRequest("a@b.com", "Secret1"));

        result.Token.Should().Be("tok");
    }

    [Fact]
    public async Task Login_WrongPassword_ThrowsUnauthorized()
    {
        var user = new AppUser { Email = "a@b.com", EmailConfirmed = true };
        _userManager.Setup(m => m.FindByEmailAsync("a@b.com")).ReturnsAsync(user);
        _userManager.Setup(m => m.CheckPasswordAsync(user, "wrong")).ReturnsAsync(false);

        await _sut.Invoking(s => s.LoginAsync(new LoginRequest("a@b.com", "wrong")))
            .Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task ConfirmEmail_ValidToken_Succeeds()
    {
        var user = new AppUser { Id = "u1", Email = "a@b.com" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _userManager.Setup(m => m.ConfirmEmailAsync(user, "rawtoken")).ReturnsAsync(IdentityResult.Success);

        await _sut.ConfirmEmailAsync(new ConfirmEmailRequest("u1", "rawtoken"));

        _userManager.Verify(m => m.ConfirmEmailAsync(user, "rawtoken"), Times.Once);
    }

    [Fact]
    public async Task ConfirmEmail_InvalidToken_Throws()
    {
        var user = new AppUser { Id = "u1", Email = "a@b.com" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _userManager.Setup(m => m.ConfirmEmailAsync(user, "bad"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Invalid" }));

        await _sut.Invoking(s => s.ConfirmEmailAsync(new ConfirmEmailRequest("u1", "bad")))
            .Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task GoogleLogin_NewUser_CreatesAndReturnsToken()
    {
        _google.Setup(g => g.ValidateAsync("idtok"))
            .ReturnsAsync(new GoogleUserInfo("google-sub", "a@b.com", true, "Alice"));
        _userManager.Setup(m => m.FindByEmailAsync("a@b.com")).ReturnsAsync((AppUser?)null);
        _userManager.Setup(m => m.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((AppUser?)null);
        _userManager.Setup(m => m.CreateAsync(It.IsAny<AppUser>()))
            .ReturnsAsync(IdentityResult.Success);

        var result = await _sut.LoginWithGoogleAsync(new GoogleLoginRequest("idtok"));

        result.Token.Should().Be("tok");
        _publisher.Verify(p => p.PublishAsync(It.IsAny<UserRegisteredMessage>()), Times.Once);
    }

    [Fact]
    public async Task GoogleLogin_UnverifiedEmail_Throws()
    {
        _google.Setup(g => g.ValidateAsync("idtok"))
            .ReturnsAsync(new GoogleUserInfo("google-sub", "a@b.com", false, "Alice"));

        await _sut.Invoking(s => s.LoginWithGoogleAsync(new GoogleLoginRequest("idtok")))
            .Should().ThrowAsync<UnauthorizedException>().WithMessage("*verificata*");
    }
}
