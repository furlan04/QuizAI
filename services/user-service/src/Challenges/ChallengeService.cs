using UserService.Challenges.Models;
using UserService.Challenges.Models.Dtos;
using UserService.Friendships;
using UserService.Messaging.Messages;
using UserService.Messaging.Publishers;
using UserService.Users;

namespace UserService.Challenges;

public class ChallengeConflictException : Exception
{
    public ChallengeConflictException(string message) : base(message) { }
}

public class ChallengeService : IChallengeService
{
    private readonly IChallengeRepository _repo;
    private readonly IFriendshipRepository _friendships;
    private readonly IUserRepository _users;
    private readonly ChallengeCreatedPublisher _publisher;

    public ChallengeService(
        IChallengeRepository repo,
        IFriendshipRepository friendships,
        IUserRepository users,
        ChallengeCreatedPublisher publisher)
    {
        _repo        = repo;
        _friendships = friendships;
        _users       = users;
        _publisher   = publisher;
    }

    public async Task<List<ChallengeResponse>> GetChallengesAsync(string userId, string? status)
    {
        var challenges = await _repo.GetUserChallengesAsync(userId, status);
        return challenges.Select(ToResponse).ToList();
    }

    public async Task<CreateChallengeResponse> CreateAsync(
        string challengerId, string targetUsername, string quizId)
    {
        var target = await _users.GetByUsernameAsync(targetUsername)
            ?? throw new KeyNotFoundException($"User '{targetUsername}' not found.");

        if (!await _friendships.AreFriendsAsync(challengerId, target.Id))
            throw new InvalidOperationException("Non siete amici.");

        var existing = await _repo.GetPendingBetweenUsersForQuizAsync(
            challengerId, target.Id, quizId);

        if (existing is not null)
            throw new ChallengeConflictException("Sfida già in corso su questo quiz.");

        var challenge = new Challenge
        {
            ChallengerId = challengerId,
            ChallengedId = target.Id,
            QuizId       = quizId,
            Status       = "pending",
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow,
        };

        var id = await _repo.CreateAsync(challenge);

        await _publisher.PublishAsync(new ChallengeCreatedMessage(
            id, challengerId, target.Id, quizId));

        return new CreateChallengeResponse(id, "pending");
    }

    public async Task<RespondChallengeResponse> RespondAsync(
        string challengeId, string userId, string action)
    {
        var challenge = await _repo.GetByIdAsync(challengeId)
            ?? throw new KeyNotFoundException("Challenge not found.");

        if (challenge.ChallengedId != userId)
            throw new UnauthorizedAccessException("Only the challenged user can respond.");

        if (challenge.Status != "pending")
            throw new InvalidOperationException("Challenge is no longer pending.");

        var newStatus = action == "accept" ? "accepted" : "rejected";
        await _repo.UpdateStatusAsync(challengeId, newStatus);
        return new RespondChallengeResponse(challengeId, newStatus);
    }

    private static ChallengeResponse ToResponse(Challenge c) => new(
        c.Id, c.ChallengerId, c.ChallengedId, c.QuizId, c.Status,
        c.ChallengerScore, c.ChallengedScore, c.WinnerId, c.CreatedAt);
}
