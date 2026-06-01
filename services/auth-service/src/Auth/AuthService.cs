using System.Web;
using AuthService.Auth.Dtos;
using AuthService.Email;
using AuthService.Identity;
using AuthService.Jwt;
using AuthService.Messaging;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IJwtTokenGenerator _jwt;
    private readonly IUserRegisteredPublisher _publisher;
    private readonly IEmailSender _email;
    private readonly IGoogleTokenValidator _google;
    private readonly IConfiguration _config;

    public AuthService(
        UserManager<AppUser> userManager,
        IJwtTokenGenerator jwt,
        IUserRegisteredPublisher publisher,
        IEmailSender email,
        IGoogleTokenValidator google,
        IConfiguration config)
    {
        _userManager = userManager;
        _jwt         = jwt;
        _publisher   = publisher;
        _email       = email;
        _google      = google;
        _config      = config;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _userManager.FindByEmailAsync(request.Email) is not null)
            throw new ConflictException(AuthErrorCodes.EmailAlreadyRegistered, "Email già registrata.");

        if (await _userManager.FindByNameAsync(request.Username) is not null)
            throw new ConflictException(AuthErrorCodes.UsernameAlreadyTaken, "Username già in uso.");

        var user = new AppUser
        {
            UserName  = request.Username,
            Email     = request.Email,
            CreatedAt = DateTime.UtcNow,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new ConflictException(AuthErrorCodes.PasswordRejected, result.Errors.First().Description);

        // Profilo lato user-service: creato subito
        await _publisher.PublishAsync(new UserRegisteredMessage(user.Id, user.UserName!, user.Email!));

        // Email di conferma
        await SendConfirmationEmailAsync(user);

        return new RegisterResponse(
            user.Id,
            "Registrazione completata. Controlla la tua email per confermare l'account.");
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new UnauthorizedException(AuthErrorCodes.InvalidCredentials, "Credenziali non valide.");

        if (!await _userManager.CheckPasswordAsync(user, request.Password))
            throw new UnauthorizedException(AuthErrorCodes.InvalidCredentials, "Credenziali non valide.");

        if (!user.EmailConfirmed)
            throw new UnauthorizedException(AuthErrorCodes.EmailNotConfirmed, "Email non confermata.");

        var (token, expiresAt) = _jwt.Generate(user);
        return new AuthResponse(user.Id, user.UserName!, user.Email!, token, expiresAt);
    }

    public async Task ConfirmEmailAsync(ConfirmEmailRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId)
            ?? throw new UnauthorizedException(AuthErrorCodes.UserNotFound, "Utente non trovato.");

        var result = await _userManager.ConfirmEmailAsync(user, request.Token);
        if (!result.Succeeded)
            throw new UnauthorizedException(AuthErrorCodes.InvalidConfirmationToken, "Token di conferma non valido o scaduto.");
    }

    public async Task ResendConfirmationAsync(ResendConfirmationRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        // Non rivelare l'esistenza dell'account: ritorna sempre OK
        if (user is null || user.EmailConfirmed) return;
        await SendConfirmationEmailAsync(user);
    }

    public async Task<AuthResponse> LoginWithGoogleAsync(GoogleLoginRequest request)
    {
        GoogleUserInfo info;
        try
        {
            info = await _google.ValidateAsync(request.IdToken);
        }
        catch (Exception ex)
        {
            throw new UnauthorizedException(AuthErrorCodes.InvalidGoogleToken, $"Token Google non valido: {ex.Message}");
        }

        if (!info.EmailVerified)
            throw new UnauthorizedException(AuthErrorCodes.GoogleEmailNotVerified, "L'email Google non è verificata.");

        var user = await _userManager.FindByEmailAsync(info.Email);
        if (user is null)
        {
            // Crea l'account: username derivato dall'email, già confermato (Google verifica l'email)
            var username = await GenerateUniqueUsernameAsync(info.Email);
            user = new AppUser
            {
                UserName       = username,
                Email          = info.Email,
                EmailConfirmed = true,
                CreatedAt      = DateTime.UtcNow,
            };
            var create = await _userManager.CreateAsync(user);
            if (!create.Succeeded)
                throw new UnauthorizedException(AuthErrorCodes.GoogleAccountCreateFailed, create.Errors.First().Description);

            await _publisher.PublishAsync(new UserRegisteredMessage(user.Id, user.UserName!, user.Email!));
        }
        else if (!user.EmailConfirmed)
        {
            // L'utente esisteva ma non aveva confermato: la verifica Google vale come conferma.
            user.EmailConfirmed = true;
            await _userManager.UpdateAsync(user);
        }

        var (token, expiresAt) = _jwt.Generate(user);
        return new AuthResponse(user.Id, user.UserName!, user.Email!, token, expiresAt);
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private async Task SendConfirmationEmailAsync(AppUser user)
    {
        var rawToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var frontend = _config["FRONTEND_URL"]?.TrimEnd('/') ?? "http://localhost:3000";
        var link = $"{frontend}/confirm-email?userId={HttpUtility.UrlEncode(user.Id)}&token={HttpUtility.UrlEncode(rawToken)}";

        var html = $"""
            <p>Ciao <strong>{HttpUtility.HtmlEncode(user.UserName)}</strong>,</p>
            <p>Per completare la registrazione su <strong>QuizAI</strong>, conferma il tuo indirizzo email cliccando il link qui sotto:</p>
            <p><a href="{link}">Conferma il mio account</a></p>
            <p>Se non sei stato tu a registrarti, ignora questa email.</p>
            """;

        await _email.SendAsync(user.Email!, "Conferma il tuo account QuizAI", html);
    }

    private async Task<string> GenerateUniqueUsernameAsync(string email)
    {
        var basePart = new string((email.Split('@')[0])
            .Where(c => char.IsLetterOrDigit(c) || c == '_').ToArray());
        if (basePart.Length < 3) basePart = $"user{Guid.NewGuid().ToString("N")[..6]}";
        if (basePart.Length > 16) basePart = basePart[..16];

        var candidate = basePart;
        var suffix = 0;
        while (await _userManager.FindByNameAsync(candidate) is not null)
        {
            suffix++;
            candidate = $"{basePart}{suffix}";
        }
        return candidate;
    }
}
