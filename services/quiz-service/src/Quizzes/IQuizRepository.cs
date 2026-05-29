using QuizService.Quizzes.Models;

namespace QuizService.Quizzes;

public interface IQuizRepository
{
    Task<string> CreateAsync(Quiz quiz);
    Task<Quiz?> GetByIdAsync(string id);
    Task<(List<Quiz> Items, long Total)> GetPagedAsync(
        string? topic, string? difficulty, int page, int pageSize);
    Task UpdateFromGeneratedAsync(
        string id, string status, List<Question>? questions,
        List<string>? tags, string? error);
}
