using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace QuizService.Sessions;

public record CreateSessionRequest(string QuizId);
public record AnswerRequest(int QuestionIndex, int SelectedIndex);

[ApiController]
[Route("sessions")]
[Authorize]
public class SessionsController : ControllerBase
{
    private readonly ISessionService _service;

    public SessionsController(ISessionService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSessionRequest request)
    {
        try
        {
            var userId = GetUserId();
            var result = await _service.CreateAsync(request.QuizId, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("{id}/answer")]
    public async Task<IActionResult> Answer(string id, [FromBody] AnswerRequest request)
    {
        try
        {
            var userId = GetUserId();
            var result = await _service.AnswerAsync(
                id, userId, request.QuestionIndex, request.SelectedIndex);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)          { return NotFound(new { error = ex.Message }); }
        catch (UnauthorizedAccessException)      { return Forbid(); }
        catch (InvalidOperationException ex)     { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentOutOfRangeException ex)   { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> Complete(string id)
    {
        try
        {
            var userId   = GetUserId();
            var email    = User.FindFirstValue("email") ?? "";
            var username = User.FindFirstValue("username") ?? userId;
            var result   = await _service.CompleteAsync(id, userId, email, username);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)        { return NotFound(new { error = ex.Message }); }
        catch (UnauthorizedAccessException)    { return Forbid(); }
        catch (InvalidOperationException ex)   { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        try
        {
            var result = await _service.GetAsync(id, GetUserId());
            return Ok(result);
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (UnauthorizedAccessException)  { return Forbid(); }
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")!;
}
