using AuthService.Auth.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Auth;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

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
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            return Ok(await _auth.LoginAsync(request));
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
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            return Ok(await _auth.LoginWithGoogleAsync(request));
        }
        catch (UnauthorizedException ex)
        {
            return Unauthorized(new { code = ex.Code, error = ex.Message });
        }
    }
}
