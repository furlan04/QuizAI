using Microsoft.AspNetCore.Mvc;
using QuizService.Quizzes;

namespace QuizService.Leaderboard;

[ApiController]
[Route("quizzes/{quizId}/leaderboard")]
public class LeaderboardController : ControllerBase
{
    private readonly IQuizRepository _quizzes;

    public LeaderboardController(IQuizRepository quizzes) => _quizzes = quizzes;

    [HttpGet]
    public async Task<IActionResult> Get(string quizId)
    {
        var quiz = await _quizzes.GetByIdAsync(quizId);
        if (quiz is null) return NotFound();

        var top100 = quiz.Leaderboard
            .OrderByDescending(e => e.Score)
            .ThenBy(e => e.CompletedAt)
            .Take(100)
            .ToList();

        return Ok(top100);
    }
}
