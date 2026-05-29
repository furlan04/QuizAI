using Moq;
using UserService.Challenges;
using UserService.Challenges.Models;
using UserService.Friendships;
using UserService.Messaging.Messages;
using UserService.Messaging.Publishers;
using UserService.Users;
using UserService.Users.Models;

namespace UserService.Tests.Challenges;

public class ChallengeServiceTests
{
    private readonly Mock<IChallengeRepository> _repo = new();
    private readonly Mock<IFriendshipRepository> _friendships = new();
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<ChallengeCreatedPublisher> _publisher;
    private readonly IChallengeService _sut;

    public ChallengeServiceTests()
    {
        _publisher = new Mock<ChallengeCreatedPublisher>(
            Mock.Of<MassTransit.ISendEndpointProvider>());

        _sut = new ChallengeService(
            _repo.Object, _friendships.Object,
            _users.Object, _publisher.Object);
    }

    private static User MakeUser(string id, string username) =>
        new() { Id = id, Username = username, Email = $"{username}@x.com",
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

    [Fact]
    public async Task Create_NotFriends_ThrowsInvalidOperation()
    {
        _users.Setup(r => r.GetByUsernameAsync("bob"))
            .ReturnsAsync(MakeUser("bob-id", "bob"));
        _friendships.Setup(r => r.AreFriendsAsync("alice-id", "bob-id"))
            .ReturnsAsync(false);

        await _sut.Invoking(s => s.CreateAsync("alice-id", "bob", "quiz-1"))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*amici*");
    }

    [Fact]
    public async Task Create_DuplicatePending_ThrowsConflict()
    {
        _users.Setup(r => r.GetByUsernameAsync("bob"))
            .ReturnsAsync(MakeUser("bob-id", "bob"));
        _friendships.Setup(r => r.AreFriendsAsync("alice-id", "bob-id"))
            .ReturnsAsync(true);
        _repo.Setup(r => r.GetPendingBetweenUsersForQuizAsync("alice-id", "bob-id", "quiz-1"))
            .ReturnsAsync(new Challenge { Id = "c1", Status = "pending" });

        await _sut.Invoking(s => s.CreateAsync("alice-id", "bob", "quiz-1"))
            .Should().ThrowAsync<ChallengeConflictException>()
            .WithMessage("*Sfida*");
    }

    [Fact]
    public async Task Create_ValidChallenge_ReturnsCreated()
    {
        _users.Setup(r => r.GetByUsernameAsync("bob"))
            .ReturnsAsync(MakeUser("bob-id", "bob"));
        _friendships.Setup(r => r.AreFriendsAsync("alice-id", "bob-id"))
            .ReturnsAsync(true);
        _repo.Setup(r => r.GetPendingBetweenUsersForQuizAsync("alice-id", "bob-id", "quiz-1"))
            .ReturnsAsync((Challenge?)null);
        _repo.Setup(r => r.CreateAsync(It.IsAny<Challenge>())).ReturnsAsync("c1");
        _publisher.Setup(p => p.PublishAsync(It.IsAny<ChallengeCreatedMessage>()))
            .Returns(Task.CompletedTask);

        var result = await _sut.CreateAsync("alice-id", "bob", "quiz-1");

        result.ChallengeId.Should().Be("c1");
        result.Status.Should().Be("pending");
    }

    [Fact]
    public async Task Respond_WrongUser_ThrowsUnauthorized()
    {
        _repo.Setup(r => r.GetByIdAsync("c1"))
            .ReturnsAsync(new Challenge
                { Id = "c1", ChallengerId = "alice-id", ChallengedId = "bob-id",
                  Status = "pending" });

        await _sut.Invoking(s => s.RespondAsync("c1", "alice-id", "accept"))
            .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Respond_Accept_ReturnsAccepted()
    {
        _repo.Setup(r => r.GetByIdAsync("c1"))
            .ReturnsAsync(new Challenge
                { Id = "c1", ChallengerId = "alice-id", ChallengedId = "bob-id",
                  Status = "pending" });
        _repo.Setup(r => r.UpdateStatusAsync("c1", "accepted")).Returns(Task.CompletedTask);

        var result = await _sut.RespondAsync("c1", "bob-id", "accept");

        result.Status.Should().Be("accepted");
    }
}
