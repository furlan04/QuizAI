using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using QuizService.Messaging.Messages;
using QuizService.Messaging.Publishers;
using QuizService.Quizzes.Models;
using System.Security.Claims;

namespace QuizService.Quizzes;

public record GenerateQuizRequest(string Topic, string Difficulty, int NumQuestions);
public record GenerateQuizResponse(string QuizId, string Status);
public record QuizSummary(
    string Id, string Title, string Topic, string Difficulty,
    int NumQuestions, List<string> Tags,
    string CreatedBy, string CreatedByUsername, DateTime CreatedAt);
public record PagedResponse<T>(List<T> Items, long Total, int Page, int PageSize);

[ApiController]
[Route("quizzes")]
public class QuizzesController : ControllerBase
{
    private readonly IQuizRepository _quizzes;
    private readonly IQuizGenerationPublisher _publisher;

    public QuizzesController(IQuizRepository quizzes, IQuizGenerationPublisher publisher)
    {
        _quizzes = quizzes;
        _publisher = publisher;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? topic,
        [FromQuery] string? difficulty,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _quizzes.GetPagedAsync(topic, difficulty, page, pageSize);
        var summaries = items.Select(q =>
            new QuizSummary(q.Id, q.Title, q.Topic, q.Difficulty,
                q.NumQuestions, q.Tags,
                q.CreatedBy, q.CreatedByUsername ?? "", q.CreatedAt)).ToList();

        return Ok(new PagedResponse<QuizSummary>(summaries, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var quiz = await _quizzes.GetByIdAsync(id);
        if (quiz is null) return NotFound();

        return quiz.Status switch
        {
            "generating" => Accepted(new { status = "generating" }),
            "failed"     => StatusCode(500, new { error = quiz.Error }),
            _            => Ok(quiz),
        };
    }

    [HttpPost("generate")]
    [Authorize]
    public async Task<IActionResult> Generate([FromBody] GenerateQuizRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub")!;
        var username = User.FindFirstValue("username") ?? "";

        var quizId = ObjectId.GenerateNewId().ToString();

        var quiz = new Quiz
        {
            Id = quizId,
            Title = request.Topic,
            Topic = request.Topic,
            Difficulty = request.Difficulty,
            NumQuestions = request.NumQuestions,
            CreatedBy = userId,
            CreatedByUsername = username,
            Status = "generating",
            CreatedAt = DateTime.UtcNow,
        };

        await _quizzes.CreateAsync(quiz);

        await _publisher.PublishAsync(new QuizGenerateMessage(
            quizId, request.Topic, request.Difficulty,
            request.NumQuestions, userId));

        return Accepted(new GenerateQuizResponse(quizId, "generating"));
    }
}

// Needed for ClaimTypes constant in this file
file static class JwtRegisteredClaimNames
{
    public const string Sub = "sub";
}
