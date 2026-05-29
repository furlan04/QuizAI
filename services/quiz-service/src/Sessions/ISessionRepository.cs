using QuizService.Sessions.Models;

namespace QuizService.Sessions;

public interface ISessionRepository
{
    Task<string> CreateAsync(Session session);
    Task<Session?> GetByIdAsync(string id);
    Task AddAnswerAsync(string sessionId, Answer answer);
    Task CompleteAsync(string sessionId, int score, DateTime completedAt);
}
