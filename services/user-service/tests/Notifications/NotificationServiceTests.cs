using UserService.Friendships;
using UserService.Friendships.Models;
using UserService.Notifications;
using UserService.Notifications.Models;
using UserService.Users;
using UserService.Users.Models;

namespace UserService.Tests.Notifications;

public class NotificationServiceTests
{
    private readonly Mock<INotificationRepository> _repo = new();
    private readonly Mock<IFriendshipRepository> _friendships = new();
    private readonly Mock<IUserRepository> _users = new();
    private readonly INotificationService _sut;

    public NotificationServiceTests()
        => _sut = new NotificationService(_repo.Object, _friendships.Object, _users.Object);

    private static User MakeUser(string id, string username) =>
        new() { Id = id, Username = username, Email = $"{username}@x.com",
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

    // ── Friend request ────────────────────────────────────────────────────────
    [Fact]
    public async Task FriendRequest_CreatesNotificationForAddressee()
    {
        _repo.Setup(r => r.ExistsAsync("bob-id", "friend_request", "f1")).ReturnsAsync(false);
        _users.Setup(u => u.GetByIdAsync("alice-id")).ReturnsAsync(MakeUser("alice-id", "alice"));

        await _sut.CreateFriendRequestNotificationAsync("bob-id", "alice-id", "f1");

        _repo.Verify(r => r.CreateAsync(It.Is<Notification>(n =>
            n.UserId == "bob-id" &&
            n.Type == "friend_request" &&
            n.ActorId == "alice-id" &&
            n.ActorUsername == "alice" &&
            n.FriendshipId == "f1" &&
            n.ReferenceId == "f1" &&
            !n.Read)), Times.Once);
    }

    [Fact]
    public async Task FriendRequest_Duplicate_IsSkipped()
    {
        _repo.Setup(r => r.ExistsAsync("bob-id", "friend_request", "f1")).ReturnsAsync(true);

        await _sut.CreateFriendRequestNotificationAsync("bob-id", "alice-id", "f1");

        _repo.Verify(r => r.CreateAsync(It.IsAny<Notification>()), Times.Never);
    }

    // ── Quiz created fan-out ───────────────────────────────────────────────────
    [Fact]
    public async Task QuizCreated_FansOutToAcceptedFriends_ExcludingCreator()
    {
        // alice ha due amici: bob (alice requester) e carol (carol requester).
        _friendships.Setup(f => f.GetAcceptedAsync("alice-id")).ReturnsAsync(new List<Friendship>
        {
            new() { RequesterId = "alice-id", AddresseeId = "bob-id",   Status = "accepted" },
            new() { RequesterId = "carol-id", AddresseeId = "alice-id", Status = "accepted" },
        });
        _repo.Setup(r => r.ExistsAsync(It.IsAny<string>(), "quiz_created", "q1")).ReturnsAsync(false);

        List<Notification>? captured = null;
        _repo.Setup(r => r.CreateManyAsync(It.IsAny<IReadOnlyCollection<Notification>>()))
            .Callback<IReadOnlyCollection<Notification>>(c => captured = c.ToList())
            .Returns(Task.CompletedTask);

        await _sut.CreateQuizNotificationsAsync("alice-id", "alice", "q1", "Storia");

        captured.Should().NotBeNull();
        captured!.Select(n => n.UserId).Should().BeEquivalentTo(new[] { "bob-id", "carol-id" });
        captured.Should().OnlyContain(n =>
            n.Type == "quiz_created" && n.QuizId == "q1" && n.QuizTitle == "Storia" &&
            n.ActorId == "alice-id" && n.ReferenceId == "q1" && !n.Read);
    }

    [Fact]
    public async Task QuizCreated_NoFriends_WritesNothing()
    {
        _friendships.Setup(f => f.GetAcceptedAsync("alice-id")).ReturnsAsync(new List<Friendship>());

        await _sut.CreateQuizNotificationsAsync("alice-id", "alice", "q1", "Storia");

        _repo.Verify(r => r.CreateManyAsync(It.Is<IReadOnlyCollection<Notification>>(c => c.Count == 0)), Times.Once);
    }

    [Fact]
    public async Task QuizCreated_SkipsFriendsAlreadyNotified()
    {
        _friendships.Setup(f => f.GetAcceptedAsync("alice-id")).ReturnsAsync(new List<Friendship>
        {
            new() { RequesterId = "alice-id", AddresseeId = "bob-id",   Status = "accepted" },
            new() { RequesterId = "alice-id", AddresseeId = "carol-id", Status = "accepted" },
        });
        _repo.Setup(r => r.ExistsAsync("bob-id",   "quiz_created", "q1")).ReturnsAsync(true);  // già notificato
        _repo.Setup(r => r.ExistsAsync("carol-id", "quiz_created", "q1")).ReturnsAsync(false);

        List<Notification>? captured = null;
        _repo.Setup(r => r.CreateManyAsync(It.IsAny<IReadOnlyCollection<Notification>>()))
            .Callback<IReadOnlyCollection<Notification>>(c => captured = c.ToList())
            .Returns(Task.CompletedTask);

        await _sut.CreateQuizNotificationsAsync("alice-id", "alice", "q1", "Storia");

        captured!.Select(n => n.UserId).Should().BeEquivalentTo(new[] { "carol-id" });
    }

    // ── Query / read ───────────────────────────────────────────────────────────
    [Fact]
    public async Task MarkRead_DelegatesToRepositoryScopedToUser()
    {
        _repo.Setup(r => r.MarkReadAsync("n1", "alice-id")).ReturnsAsync(true);

        var ok = await _sut.MarkReadAsync("n1", "alice-id");

        ok.Should().BeTrue();
        _repo.Verify(r => r.MarkReadAsync("n1", "alice-id"), Times.Once);
    }

    [Fact]
    public async Task GetUnreadCount_DelegatesToRepository()
    {
        _repo.Setup(r => r.CountUnreadAsync("alice-id")).ReturnsAsync(3);

        var count = await _sut.GetUnreadCountAsync("alice-id");

        count.Should().Be(3);
    }
}
