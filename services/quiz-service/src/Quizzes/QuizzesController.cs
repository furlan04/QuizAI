using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizService.Documents;
using QuizService.Messaging.Messages;
using QuizService.Messaging.Publishers;
using QuizService.Quizzes.Models;
using System.Security.Claims;

namespace QuizService.Quizzes;

public record GenerateQuizRequest(string Topic, string Difficulty, int NumQuestions, bool DeepSearch = false);
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
    private readonly IDocumentExtractionClient _extractor;

    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".pdf", ".docx", ".pptx" };
    private const long MaxFileBytes = 15L * 1024 * 1024; // 15 MB

    public QuizzesController(
        IQuizRepository quizzes,
        IQuizGenerationPublisher publisher,
        IDocumentExtractionClient extractor)
    {
        _quizzes = quizzes;
        _publisher = publisher;
        _extractor = extractor;
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

        var quizId = _quizzes.NewId();

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
            request.NumQuestions, userId, DeepSearch: request.DeepSearch));

        return Accepted(new GenerateQuizResponse(quizId, "generating"));
    }

    /// <summary>
    /// Genera un quiz a partire da un documento caricato (PDF/DOCX/PPTX).
    /// Il file viene inoltrato all'ai-agent-service che ne estrae il testo in
    /// memoria; il file non viene mai salvato né su questo servizio né altrove.
    /// </summary>
    [HttpPost("generate-from-file")]
    [Authorize]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> GenerateFromFile(
        [FromForm] IFormFile file,
        [FromForm] string difficulty,
        [FromForm] int numQuestions)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Nessun file caricato" });

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { error = "Formato non supportato. Usa PDF, DOCX o PPTX." });
        if (file.Length > MaxFileBytes)
            return StatusCode(StatusCodes.Status413PayloadTooLarge,
                new { error = "File troppo grande (max 15 MB)" });
        if (numQuestions is < 1 or > 20)
            return BadRequest(new { error = "Il numero di domande deve essere tra 1 e 20" });
        if (difficulty is not ("easy" or "medium" or "hard"))
            return BadRequest(new { error = "Difficoltà non valida" });

        ExtractedDocument extracted;
        try
        {
            await using var stream = file.OpenReadStream();
            extracted = await _extractor.ExtractAsync(stream, file.FileName, file.ContentType);
        }
        catch (DocumentExtractionException ex)
        {
            var status = ex.StatusCode is >= 400 and < 500
                ? StatusCodes.Status422UnprocessableEntity
                : StatusCodes.Status502BadGateway;
            return StatusCode(status, new { error = ex.Message });
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub")!;
        var username = User.FindFirstValue("username") ?? "";

        var topic = string.IsNullOrWhiteSpace(extracted.SuggestedTopic)
            ? Path.GetFileNameWithoutExtension(file.FileName)
            : extracted.SuggestedTopic;

        var quizId = _quizzes.NewId();

        var quiz = new Quiz
        {
            Id = quizId,
            Title = topic,
            Topic = topic,
            Difficulty = difficulty,
            NumQuestions = numQuestions,
            CreatedBy = userId,
            CreatedByUsername = username,
            Status = "generating",
            CreatedAt = DateTime.UtcNow,
        };

        await _quizzes.CreateAsync(quiz);

        // source_text viaggia solo nel messaggio transitorio: non viene persistito.
        await _publisher.PublishAsync(new QuizGenerateMessage(
            quizId, topic, difficulty, numQuestions, userId, extracted.Text));

        return Accepted(new GenerateQuizResponse(quizId, "generating"));
    }
}

// Needed for ClaimTypes constant in this file
file static class JwtRegisteredClaimNames
{
    public const string Sub = "sub";
}
