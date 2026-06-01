using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UserService.Challenges.Models.Dtos;

namespace UserService.Challenges;

[ApiController]
[Authorize]
[Route("users/me/challenges")]
public class ChallengesController : ControllerBase
{
    private readonly IChallengeService _service;

    public ChallengesController(IChallengeService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetChallenges([FromQuery] string? status) =>
        Ok(await _service.GetChallengesAsync(GetUserId(), status));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateChallengeRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(
                GetUserId(), request.Username, request.QuizId);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (KeyNotFoundException ex)          { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex)     { return BadRequest(new { error = ex.Message }); }
        catch (ChallengeConflictException ex)    { return Conflict(new { error = ex.Message }); }
    }

    [HttpPut("{id}/respond")]
    public async Task<IActionResult> Respond(string id,
        [FromBody] RespondChallengeRequest request)
    {
        try
        {
            return Ok(await _service.RespondAsync(id, GetUserId(), request.Action));
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { error = ex.Message }); }
        catch (UnauthorizedAccessException)  { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!;
}
