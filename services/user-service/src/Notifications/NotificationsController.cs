using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UserService.Notifications.Models.Dtos;

namespace UserService.Notifications;

[ApiController]
[Authorize]
[Route("users/me/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int limit = 50) =>
        Ok(await _service.GetForUserAsync(GetUserId(), unreadOnly, limit));

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount() =>
        Ok(new UnreadCountResponse(await _service.GetUnreadCountAsync(GetUserId())));

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(string id)
    {
        var updated = await _service.MarkReadAsync(id, GetUserId());
        return updated ? NoContent() : NotFound();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _service.MarkAllReadAsync(GetUserId());
        return NoContent();
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!;
}
