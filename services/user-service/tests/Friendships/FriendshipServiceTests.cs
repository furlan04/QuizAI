using UserService.Friendships;
using UserService.Friendships.Models;
using UserService.Messaging.Messages;
using UserService.Messaging.Publishers;
using UserService.Users;
using UserService.Users.Models;

namespace UserService.Tests.Friendships;

public class FriendshipServiceTests
{
    private readonly Mock<IFriendshipRepository> _repo = new();
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IFriendRequestPublisher> _friendRequests = new();
    private readonly IFriendshipService _sut;

    public FriendshipServiceTests()
        => _sut = new FriendshipService(_repo.Object, _users.Object, _friendRequests.Object);

    private static User MakeUser(string id, string username) =>
        new() { Id = id, Username = username, Email = $"{username}@x.com",
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

    [Fact]
    public async Task SendRequest_NewFriendship_ReturnsPending()
    {
        _users.Setup(r => r.GetByUsernameAsync("bob"))
            .ReturnsAsync(MakeUser("bob-id", "bob"));
        _repo.Setup(r => r.GetBetweenUsersAsync("alice-id", "bob-id"))
            .ReturnsAsync((Friendship?)null);
        _repo.Setup(r => r.CreateAsync(It.IsAny<Friendship>()))
            .ReturnsAsync("f1");

        var result = await _sut.SendRequestAsync("alice-id", "bob");

        result.Status.Should().Be("pending");
        result.FriendshipId.Should().Be("f1");
        _friendRequests.Verify(p => p.PublishAsync(It.Is<FriendRequestSentMessage>(m =>
            m.FriendshipId == "f1" && m.RequesterId == "alice-id" && m.AddresseeId == "bob-id")),
            Times.Once);
    }

    [Fact]
    public async Task SendRequest_AlreadyFriends_ThrowsConflict()
    {
        _users.Setup(r => r.GetByUsernameAsync("bob"))
            .ReturnsAsync(MakeUser("bob-id", "bob"));
        _repo.Setup(r => r.GetBetweenUsersAsync("alice-id", "bob-id"))
            .ReturnsAsync(new Friendship { Status = "accepted" });

        await _sut.Invoking(s => s.SendRequestAsync("alice-id", "bob"))
            .Should().ThrowAsync<ConflictException>()
            .WithMessage("*amici*");
    }

    [Fact]
    public async Task SendRequest_PendingExists_ThrowsConflict()
    {
        _users.Setup(r => r.GetByUsernameAsync("bob"))
            .ReturnsAsync(MakeUser("bob-id", "bob"));
        _repo.Setup(r => r.GetBetweenUsersAsync("alice-id", "bob-id"))
            .ReturnsAsync(new Friendship { Status = "pending" });

        await _sut.Invoking(s => s.SendRequestAsync("alice-id", "bob"))
            .Should().ThrowAsync<ConflictException>()
            .WithMessage("*Richiesta*");
    }

    [Fact]
    public async Task SendRequest_PreviouslyRejected_DeletesOldAndResendsAsPending()
    {
        _users.Setup(r => r.GetByUsernameAsync("bob"))
            .ReturnsAsync(MakeUser("bob-id", "bob"));
        // Vecchia richiesta rifiutata, in direzione opposta (bob aveva chiesto ad alice).
        _repo.Setup(r => r.GetBetweenUsersAsync("alice-id", "bob-id"))
            .ReturnsAsync(new Friendship
                { Id = "old", RequesterId = "bob-id", AddresseeId = "alice-id", Status = "rejected" });
        _repo.Setup(r => r.DeleteBetweenUsersAsync("alice-id", "bob-id")).Returns(Task.CompletedTask);
        _repo.Setup(r => r.CreateAsync(It.IsAny<Friendship>())).ReturnsAsync("f2");

        var result = await _sut.SendRequestAsync("alice-id", "bob");

        result.Status.Should().Be("pending");
        result.FriendshipId.Should().Be("f2");
        _repo.Verify(r => r.DeleteBetweenUsersAsync("alice-id", "bob-id"), Times.Once);
        _repo.Verify(r => r.CreateAsync(It.Is<Friendship>(f =>
            f.RequesterId == "alice-id" && f.AddresseeId == "bob-id" && f.Status == "pending")), Times.Once);
    }

    [Fact]
    public async Task SendRequest_UnknownUser_ThrowsKeyNotFound()
    {
        _users.Setup(r => r.GetByUsernameAsync("ghost"))
            .ReturnsAsync((User?)null);

        await _sut.Invoking(s => s.SendRequestAsync("alice-id", "ghost"))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task Respond_Accept_UpdatesToAccepted()
    {
        _repo.Setup(r => r.GetByIdAsync("f1"))
            .ReturnsAsync(new Friendship
                { Id = "f1", RequesterId = "alice-id", AddresseeId = "bob-id", Status = "pending" });
        _repo.Setup(r => r.UpdateStatusAsync("f1", "accepted")).Returns(Task.CompletedTask);

        var result = await _sut.RespondAsync("f1", "bob-id", "accept");

        result.Status.Should().Be("accepted");
    }

    [Fact]
    public async Task Respond_WrongUser_ThrowsUnauthorized()
    {
        _repo.Setup(r => r.GetByIdAsync("f1"))
            .ReturnsAsync(new Friendship
                { Id = "f1", RequesterId = "alice-id", AddresseeId = "bob-id", Status = "pending" });

        await _sut.Invoking(s => s.RespondAsync("f1", "alice-id", "accept"))
            .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Respond_NotPending_ThrowsInvalidOperation()
    {
        _repo.Setup(r => r.GetByIdAsync("f1"))
            .ReturnsAsync(new Friendship
                { Id = "f1", RequesterId = "alice-id", AddresseeId = "bob-id", Status = "accepted" });

        await _sut.Invoking(s => s.RespondAsync("f1", "bob-id", "accept"))
            .Should().ThrowAsync<InvalidOperationException>();
    }
}
