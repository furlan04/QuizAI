using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UserService.Users.Models.Dtos;

namespace UserService.Users;

[ApiController]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;

    public UsersController(IUserService service) => _service = service;

    [HttpGet("users/me")]
    public async Task<IActionResult> GetMe()
    {
        var (id, email, username) = GetClaims();
        var user = await _service.GetOrCreateAsync(id, email, username);
        return Ok(user);
    }

    [HttpPut("users/me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request)
    {
        var (id, _, _) = GetClaims();
        try
        {
            return Ok(await _service.UpdateAsync(id, request));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpGet("users/{username}")]
    public async Task<IActionResult> GetByUsername(string username)
    {
        try
        {
            return Ok(await _service.GetPublicProfileAsync(username));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpGet("users/by-id/{userId}")]
    public async Task<IActionResult> GetByUserId(string userId)
    {
        try
        {
            return Ok(await _service.GetPublicProfileByIdAsync(userId));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    private (string Id, string Email, string Username) GetClaims() => (
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!,
        User.FindFirstValue("email") ?? "",
        User.FindFirstValue("username") ?? "");
}
