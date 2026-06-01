namespace QuizService.Sessions;

public record CreateSessionResponse(
    string SessionId,
    string QuizId,
    List<QuestionDto> Questions);

public record QuestionDto(string Text, List<string> Options);

public record AnswerResponse(bool IsCorrect, int CorrectIndex, string Explanation);

public record CompleteResponse(int Score, int TotalQuestions, double Percentage);

public record SessionDetail(
    string Id,
    string QuizId,
    string UserId,
    string Status,
    int Score,
    DateTime StartedAt,
    DateTime? CompletedAt,
    List<AnswerDetail> Answers);

public record AnswerDetail(
    int QuestionIndex,
    int SelectedIndex,
    bool IsCorrect,
    DateTime AnsweredAt);

public interface ISessionService
{
    Task<CreateSessionResponse> CreateAsync(string quizId, string userId);
    Task<AnswerResponse> AnswerAsync(
        string sessionId, string userId, int questionIndex, int selectedIndex);
    Task<CompleteResponse> CompleteAsync(
        string sessionId, string userId, string userEmail, string username);
    Task<SessionDetail> GetAsync(string sessionId, string userId);
}
