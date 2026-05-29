using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using QuizService.Messaging.Messages;
using QuizService.Messaging.Publishers;
using QuizService.Quizzes;
using QuizService.Quizzes.Models;
using System.Security.Claims;

namespace QuizService.Tests.Quizzes;

public class QuizzesControllerTests
{
    private readonly Mock<IQuizRepository> _repo = new();
    private readonly Mock<IQuizGenerationPublisher> _publisher = new();
    private readonly QuizzesController _sut;

    public QuizzesControllerTests()
    {
        _sut = new QuizzesController(_repo.Object, _publisher.Object);
        SetUser("alice");
    }

    private void SetUser(string userId)
    {
        var claims = new[] { new Claim("sub", userId) };
        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"))
            }
        };
    }

    [Fact]
    public async Task GetAll_ReturnsPagedQuizzes()
    {
        _repo.Setup(r => r.GetPagedAsync(null, null, 1, 20))
            .ReturnsAsync((new List<Quiz>
            {
                new() { Id = "1", Title = "T", Topic = "T", Difficulty = "easy",
                    NumQuestions = 5, Status = "ready",
                    Tags = [], CreatedBy = "alice", CreatedAt = DateTime.UtcNow }
            }, 1L));

        var result = await _sut.GetAll(null, null, 1, 20) as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task GetById_GeneratingStatus_Returns202()
    {
        _repo.Setup(r => r.GetByIdAsync("abc"))
            .ReturnsAsync(new Quiz { Id = "abc", Status = "generating",
                Title = "T", Topic = "T", Difficulty = "easy",
                CreatedBy = "u", CreatedAt = DateTime.UtcNow });

        var result = await _sut.GetById("abc");

        result.Should().BeOfType<AcceptedResult>();
    }

    [Fact]
    public async Task GetById_NotFound_Returns404()
    {
        _repo.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((Quiz?)null);

        var result = await _sut.GetById("missing");

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Generate_CreatesQuizAndPublishes()
    {
        _repo.Setup(r => r.CreateAsync(It.IsAny<Quiz>())).ReturnsAsync("new-id");
        _publisher.Setup(p => p.PublishAsync(It.IsAny<QuizGenerateMessage>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.Generate(
            new GenerateQuizRequest("History", "easy", 5)) as AcceptedResult;

        result.Should().NotBeNull();
        _repo.Verify(r => r.CreateAsync(It.IsAny<Quiz>()), Times.Once);
        _publisher.Verify(p => p.PublishAsync(It.IsAny<QuizGenerateMessage>()), Times.Once);
    }
}
