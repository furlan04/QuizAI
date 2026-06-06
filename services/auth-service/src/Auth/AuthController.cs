using AuthService.Auth.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Auth;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly bool _secureCookie;

    public AuthController(IAuthService auth, IWebHostEnvironment env, IConfiguration config)
    {
        _auth = auth;
        // Default da spec: Secure attivo, tranne in sviluppo. Override esplicito via
        // COOKIE_SECURE per gli ambienti che servono ancora in http (es. docker su localhost).
        _secureCookie = config.GetValue<bool?>("COOKIE_SECURE") ?? !env.IsDevelopment();
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _auth.RegisterAsync(request);
            return StatusCode(StatusCodes.Status201Created, response);
        }
        catch (ConflictException ex)
        {
            return Conflict(new { code = ex.Code, error = ex.Message });
        }
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var auth = await _auth.LoginAsync(request);
            return SignInWithCookie(auth);
        }
        catch (UnauthorizedException ex)
        {
            return Unauthorized(new { code = ex.Code, error = ex.Message });
        }
    }

    [HttpPost("confirm-email")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest request)
    {
        try
        {
            await _auth.ConfirmEmailAsync(request);
            return NoContent();
        }
        catch (UnauthorizedException ex)
        {
            return Unauthorized(new { code = ex.Code, error = ex.Message });
        }
    }

    [HttpPost("resend-confirmation")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ResendConfirmation([FromBody] ResendConfirmationRequest request)
    {
        await _auth.ResendConfirmationAsync(request);
        return NoContent();
    }

    [HttpPost("google")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            var auth = await _auth.LoginWithGoogleAsync(request);
            return SignInWithCookie(auth);
        }
        catch (UnauthorizedException ex)
        {
            return Unauthorized(new { code = ex.Code, error = ex.Message });
        }
    }

    /// <summary>Cancella il cookie di sessione. Idempotente.</summary>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(AuthCookie.Name, AuthCookie.BuildForDelete(_secureCookie));
        return NoContent();
    }

    /// <summary>
    /// Info dell'utente corrente, ricavate dai claim del JWT (letto dal cookie).
    /// Usato dal frontend al boot per verificare che la sessione sia ancora valida.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Me()
    {
        var userId = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var username = User.FindFirst("username")?.Value ?? string.Empty;
        var email    = User.FindFirst("email")?.Value ?? string.Empty;
        return Ok(new UserResponse(userId, username, email));
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    /// <summary>Imposta il JWT come cookie httpOnly e restituisce solo le info utente.</summary>
    private IActionResult SignInWithCookie(AuthResponse auth)
    {
        Response.Cookies.Append(AuthCookie.Name, auth.Token, AuthCookie.Build(_secureCookie, auth.ExpiresAt));
        return Ok(new UserResponse(auth.UserId, auth.Username, auth.Email));
    }
}
