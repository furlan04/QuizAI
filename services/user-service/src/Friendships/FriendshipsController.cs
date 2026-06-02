using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UserService.Friendships.Models.Dtos;

namespace UserService.Friendships;

[ApiController]
[Authorize]
[Route("users/me/friends")]
public class FriendshipsController : ControllerBase
{
    private readonly IFriendshipService _service;

    public FriendshipsController(IFriendshipService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetFriends() =>
        Ok(await _service.GetFriendsAsync(GetUserId()));

    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests() =>
        Ok(await _service.GetPendingRequestsAsync(GetUserId()));

    [HttpPost("requests")]
    public async Task<IActionResult> SendRequest([FromBody] FriendRequestRequest request)
    {
        try
        {
            var result = await _service.SendRequestAsync(GetUserId(), request.Username);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (KeyNotFoundException ex)  { return NotFound(new { error = ex.Message }); }
        catch (ConflictException ex)     { return Conflict(new { error = ex.Message }); }
    }

    [HttpPut("requests/{id}")]
    public async Task<IActionResult> Respond(string id,
        [FromBody] RespondFriendRequestRequest request)
    {
        try
        {
            return Ok(await _service.RespondAsync(id, GetUserId(), request.Action));
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (UnauthorizedAccessException)  { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{username}")]
    public async Task<IActionResult> RemoveFriend(string username)
    {
        try
        {
            await _service.RemoveFriendAsync(GetUserId(), username);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpGet("status/{username}")]
    public async Task<IActionResult> GetStatus(string username)
    {
        try
        {
            return Ok(await _service.GetStatusAsync(GetUserId(), username));
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!;
}
