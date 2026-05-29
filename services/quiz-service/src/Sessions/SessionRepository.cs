using MongoDB.Driver;
using QuizService.Sessions.Models;

namespace QuizService.Sessions;

public class SessionRepository : ISessionRepository
{
    private readonly IMongoCollection<Session> _col;

    public SessionRepository(IMongoDatabase db)
        => _col = db.GetCollection<Session>("sessions");

    public async Task<string> CreateAsync(Session session)
    {
        await _col.InsertOneAsync(session);
        return session.Id;
    }

    public Task<Session?> GetByIdAsync(string id) =>
        _col.Find(s => s.Id == id).FirstOrDefaultAsync()!;

    public Task AddAnswerAsync(string sessionId, Answer answer)
    {
        var update = Builders<Session>.Update.Push(s => s.Answers, answer);
        return _col.UpdateOneAsync(s => s.Id == sessionId, update);
    }

    public Task CompleteAsync(string sessionId, int score, DateTime completedAt)
    {
        var update = Builders<Session>.Update
            .Set(s => s.Status, "completed")
            .Set(s => s.Score, score)
            .Set(s => s.CompletedAt, completedAt);
        return _col.UpdateOneAsync(s => s.Id == sessionId, update);
    }
}
