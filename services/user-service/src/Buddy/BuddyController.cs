namespace UserService.Buddy;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UserService.Buddy.Models;

public class CreateBuddySessionRequest
{
    public string SessionId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
}

public class UpdateBuddySessionHistoryRequest
{
    public List<BuddyMessage> History { get; set; } = new();
}

[ApiController]
[Route("users/buddy/sessions")]
[Authorize]
public class BuddyController : ControllerBase
{
    private readonly IBuddyService _buddyService;

    public BuddyController(IBuddyService buddyService)
    {
        _buddyService = buddyService;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!;

    [HttpPost]
    public async Task<IActionResult> CreateSession([FromBody] CreateBuddySessionRequest request)
    {
        var session = await _buddyService.CreateSessionAsync(request.SessionId, GetUserId(), request.Title);
        return Ok(session);
    }

    [HttpGet]
    public async Task<IActionResult> GetSessions()
    {
        var sessions = await _buddyService.GetSessionsAsync(GetUserId());
        return Ok(sessions.Select(s => new 
        {
            id = s.Id,
            title = s.Title,
            last_message_at = s.LastMessageAt
        }));
    }

    [HttpGet("{sessionId}")]
    public async Task<IActionResult> GetSession(string sessionId)
    {
        var session = await _buddyService.GetSessionAsync(sessionId, GetUserId());

        if (session == null)
        {
            return NotFound(new { error = "Session not found." });
        }

        return Ok(session);
    }

    [HttpPatch("{sessionId}")]
    public async Task<IActionResult> UpdateHistory(string sessionId, [FromBody] UpdateBuddySessionHistoryRequest request)
    {
        var success = await _buddyService.UpdateHistoryAsync(sessionId, GetUserId(), request.History);

        if (!success)
        {
            return NotFound(new { error = "Session not found." });
        }

        return Ok(new { status = "updated" });
    }

    [HttpDelete("{sessionId}")]
    public async Task<IActionResult> DeleteSession(string sessionId)
    {
        var success = await _buddyService.DeleteSessionAsync(sessionId, GetUserId());

        if (!success)
        {
            return NotFound(new { error = "Session not found." });
        }

        return Ok(new { status = "deleted" });
    }
}
