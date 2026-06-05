using MassTransit;
using Microsoft.Extensions.Logging.Abstractions;
using QuizService.Messaging.Consumers;
using QuizService.Messaging.Messages;
using QuizService.Messaging.Publishers;
using QuizService.Quizzes;
using QuizService.Quizzes.Models;

namespace QuizService.Tests.Messaging;

public class QuizGeneratedConsumerTests
{
    private readonly Mock<IQuizRepository> _quizzes = new();
    private readonly Mock<IQuizCreatedPublisher> _publisher = new();
    private readonly QuizGeneratedConsumer _sut;

    public QuizGeneratedConsumerTests()
        => _sut = new QuizGeneratedConsumer(
            _quizzes.Object, _publisher.Object, NullLogger<QuizGeneratedConsumer>.Instance);

    private static ConsumeContext<QuizGeneratedMessage> Context(QuizGeneratedMessage msg)
    {
        var ctx = new Mock<ConsumeContext<QuizGeneratedMessage>>();
        ctx.SetupGet(c => c.Message).Returns(msg);
        return ctx.Object;
    }

    [Fact]
    public async Task Ready_PublishesQuizCreated()
    {
        var msg = new QuizGeneratedMessage("q1", "ready",
            new List<GeneratedQuestion>
            {
                new("Q?", new List<string> { "a", "b" }, 0, "perché"),
            },
            new List<string> { "tag" }, null);

        _quizzes.Setup(r => r.GetByIdAsync("q1")).ReturnsAsync(new Quiz
        {
            Id = "q1", Title = "Storia", Topic = "Storia", Difficulty = "easy",
            CreatedBy = "alice-id", CreatedByUsername = "alice",
            Status = "ready", CreatedAt = DateTime.UtcNow,
        });

        await _sut.Consume(Context(msg));

        _publisher.Verify(p => p.PublishAsync(It.Is<QuizCreatedMessage>(m =>
            m.QuizId == "q1" && m.CreatorId == "alice-id" &&
            m.CreatorUsername == "alice" && m.Title == "Storia")), Times.Once);
    }

    [Fact]
    public async Task Failed_DoesNotPublish()
    {
        var msg = new QuizGeneratedMessage("q1", "failed",
            new List<GeneratedQuestion>(), new List<string>(), "boom");

        await _sut.Consume(Context(msg));

        _publisher.Verify(p => p.PublishAsync(It.IsAny<QuizCreatedMessage>()), Times.Never);
        _quizzes.Verify(r => r.GetByIdAsync(It.IsAny<string>()), Times.Never);
    }
}
