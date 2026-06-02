using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizService.Quizzes;
using System.Security.Claims;

namespace QuizService.Users;

public record UserProfile(string Id, string Username, string Email, DateTime CreatedAt,
    List<AttemptSummary> Attempts);
public record AttemptSummary(string QuizId, string QuizTitle, int Score, DateTime CompletedAt);

[ApiController]
[Route("users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly IQuizRepository _quizzes;

    public UsersController(IUserRepository users, IQuizRepository quizzes)
    {
        _users   = users;
        _quizzes = quizzes;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetUserId();
        var user = await _users.GetByIdAsync(userId);
        if (user is null) return NotFound();

        var quizIds = user.Attempts.Select(a => a.QuizId).Distinct().ToList();
        var titles  = await _quizzes.GetTitlesByIdsAsync(quizIds);

        var profile = new UserProfile(
            user.Id, user.Username, user.Email, user.CreatedAt,
            user.Attempts.Select(a => new AttemptSummary(
                a.QuizId,
                titles.GetValueOrDefault(a.QuizId, "Quiz eliminato"),
                a.Score,
                a.CompletedAt)).ToList());

        return Ok(profile);
    }

    [HttpGet("me/attempts/{quizId}")]
    public async Task<IActionResult> GetAttempt(string quizId)
    {
        var userId = GetUserId();
        var user = await _users.GetByIdAsync(userId);
        if (user is null) return NotFound();

        var attempt = user.Attempts.FirstOrDefault(a => a.QuizId == quizId);
        if (attempt is null) return NotFound(new { error = "Attempt not found." });

        return Ok(attempt);
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")!;
}
