using MongoDB.Bson;
using MongoDB.Driver;
using UserService.Challenges.Models;

namespace UserService.Challenges;

public class ChallengeRepository : IChallengeRepository
{
    private readonly IMongoCollection<Challenge> _col;

    public ChallengeRepository(IMongoDatabase db)
        => _col = db.GetCollection<Challenge>("challenges");

    public async Task<string> CreateAsync(Challenge challenge)
    {
        await _col.InsertOneAsync(challenge);
        return challenge.Id;
    }

    public Task<Challenge?> GetByIdAsync(string id)
    {
        if (!ObjectId.TryParse(id, out _)) return Task.FromResult<Challenge?>(null);
        return _col.Find(c => c.Id == id).FirstOrDefaultAsync()!;
    }

    public Task<List<Challenge>> GetUserChallengesAsync(string userId, string? status)
    {
        var filter = Builders<Challenge>.Filter.Or(
            Builders<Challenge>.Filter.Eq(c => c.ChallengerId, userId),
            Builders<Challenge>.Filter.Eq(c => c.ChallengedId, userId));

        if (!string.IsNullOrWhiteSpace(status))
            filter &= Builders<Challenge>.Filter.Eq(c => c.Status, status);

        return _col.Find(filter).SortByDescending(c => c.CreatedAt).ToListAsync();
    }

    public Task<Challenge?> GetPendingBetweenUsersForQuizAsync(
        string userId1, string userId2, string quizId)
    {
        var filter = Builders<Challenge>.Filter.And(
            Builders<Challenge>.Filter.Eq(c => c.QuizId, quizId),
            Builders<Challenge>.Filter.Eq(c => c.Status, "pending"),
            Builders<Challenge>.Filter.Or(
                Builders<Challenge>.Filter.And(
                    Builders<Challenge>.Filter.Eq(c => c.ChallengerId, userId1),
                    Builders<Challenge>.Filter.Eq(c => c.ChallengedId, userId2)),
                Builders<Challenge>.Filter.And(
                    Builders<Challenge>.Filter.Eq(c => c.ChallengerId, userId2),
                    Builders<Challenge>.Filter.Eq(c => c.ChallengedId, userId1))));
        return _col.Find(filter).FirstOrDefaultAsync()!;
    }

    public Task<Challenge?> GetAcceptedByUserAndQuizAsync(string userId, string quizId)
    {
        var filter = Builders<Challenge>.Filter.And(
            Builders<Challenge>.Filter.Eq(c => c.QuizId, quizId),
            Builders<Challenge>.Filter.Eq(c => c.Status, "accepted"),
            Builders<Challenge>.Filter.Or(
                Builders<Challenge>.Filter.Eq(c => c.ChallengerId, userId),
                Builders<Challenge>.Filter.Eq(c => c.ChallengedId, userId)));
        return _col.Find(filter).FirstOrDefaultAsync()!;
    }

    public Task UpdateStatusAsync(string id, string status) =>
        _col.UpdateOneAsync(c => c.Id == id,
            Builders<Challenge>.Update
                .Set(c => c.Status, status)
                .Set(c => c.UpdatedAt, DateTime.UtcNow));

    public Task UpdateScoreAsync(string id, bool isChallenger, int score)
    {
        var update = isChallenger
            ? Builders<Challenge>.Update.Set(c => c.ChallengerScore, score)
            : Builders<Challenge>.Update.Set(c => c.ChallengedScore, score);
        return _col.UpdateOneAsync(c => c.Id == id,
            Builders<Challenge>.Update.Combine(
                update, Builders<Challenge>.Update.Set(c => c.UpdatedAt, DateTime.UtcNow)));
    }

    public Task CompleteAsync(string id, string? winnerId) =>
        _col.UpdateOneAsync(c => c.Id == id,
            Builders<Challenge>.Update
                .Set(c => c.Status, "completed")
                .Set(c => c.WinnerId, winnerId)
                .Set(c => c.UpdatedAt, DateTime.UtcNow));
}
