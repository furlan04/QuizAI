using FluentAssertions;
using MongoDB.Driver;
using Moq;
using QuizService.Quizzes;
using QuizService.Quizzes.Models;
using QuizService.Sessions;
using QuizService.Sessions.Models;
using QuizService.Users;

namespace QuizService.Tests.Sessions;

public class SessionServiceTests
{
    private readonly Mock<ISessionRepository> _sessions = new();
    private readonly Mock<IQuizRepository> _quizzes = new();
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IMongoClient> _mongoClient = new();
    private readonly Mock<IMongoDatabase> _db = new();
    private readonly ISessionService _sut;

    public SessionServiceTests()
    {
        _sut = new SessionService(
            _sessions.Object, _quizzes.Object, _users.Object,
            _mongoClient.Object, _db.Object);
    }

    private static Quiz ReadyQuiz(string id = "quiz1") => new()
    {
        Id = id, Title = "T", Topic = "T", Difficulty = "easy",
        Status = "ready", CreatedBy = "u", CreatedAt = DateTime.UtcNow,
        Questions =
        [
            new Question { Text = "Q1?", Options = ["A","B","C","D"],
                CorrectIndex = 1, Explanation = "Because B." },
            new Question { Text = "Q2?", Options = ["X","Y","Z","W"],
                CorrectIndex = 0, Explanation = "Because X." },
        ]
    };

    [Fact]
    public async Task CreateAsync_ReadyQuiz_ReturnsSessionWithoutAnswers()
    {
        _quizzes.Setup(r => r.GetByIdAsync("quiz1")).ReturnsAsync(ReadyQuiz());
        _sessions.Setup(r => r.CreateAsync(It.IsAny<Session>())).ReturnsAsync("sess1");

        var result = await _sut.CreateAsync("quiz1", "user1");

        result.SessionId.Should().Be("sess1");
        result.Questions.Should().HaveCount(2);
        // QuestionDto has no CorrectIndex or Explanation
        result.Questions[0].GetType().GetProperty("CorrectIndex").Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_GeneratingQuiz_ThrowsInvalidOperation()
    {
        var quiz = ReadyQuiz();
        quiz.Status = "generating";
        _quizzes.Setup(r => r.GetByIdAsync("quiz1")).ReturnsAsync(quiz);

        await _sut.Invoking(s => s.CreateAsync("quiz1", "u"))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task CreateAsync_MissingQuiz_ThrowsKeyNotFound()
    {
        _quizzes.Setup(r => r.GetByIdAsync("bad")).ReturnsAsync((Quiz?)null);

        await _sut.Invoking(s => s.CreateAsync("bad", "u"))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task AnswerAsync_CorrectAnswer_ReturnsIsCorrectTrue()
    {
        var session = new Session
        {
            Id = "s1", QuizId = "quiz1", UserId = "u",
            Status = "in_progress", StartedAt = DateTime.UtcNow,
        };
        _sessions.Setup(r => r.GetByIdAsync("s1")).ReturnsAsync(session);
        _quizzes.Setup(r => r.GetByIdAsync("quiz1")).ReturnsAsync(ReadyQuiz());
        _sessions.Setup(r => r.AddAnswerAsync("s1", It.IsAny<Answer>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.AnswerAsync("s1", "u", 0, 1);

        result.IsCorrect.Should().BeTrue();
        result.CorrectIndex.Should().Be(1);
    }

    [Fact]
    public async Task AnswerAsync_WrongUser_ThrowsUnauthorized()
    {
        var session = new Session
        {
            Id = "s1", QuizId = "quiz1", UserId = "alice",
            Status = "in_progress", StartedAt = DateTime.UtcNow,
        };
        _sessions.Setup(r => r.GetByIdAsync("s1")).ReturnsAsync(session);

        await _sut.Invoking(s => s.AnswerAsync("s1", "bob", 0, 1))
            .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task AnswerAsync_AlreadyCompleted_ThrowsInvalidOperation()
    {
        var session = new Session
        {
            Id = "s1", QuizId = "quiz1", UserId = "u",
            Status = "completed", StartedAt = DateTime.UtcNow,
        };
        _sessions.Setup(r => r.GetByIdAsync("s1")).ReturnsAsync(session);

        await _sut.Invoking(s => s.AnswerAsync("s1", "u", 0, 1))
            .Should().ThrowAsync<InvalidOperationException>();
    }
}
