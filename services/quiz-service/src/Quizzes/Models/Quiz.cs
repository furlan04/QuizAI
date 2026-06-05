namespace QuizService.Quizzes.Models;

public class Quiz
{
    public string Id { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string Topic { get; set; } = default!;
    public string Difficulty { get; set; } = default!;
    public int NumQuestions { get; set; }
    public string CreatedBy { get; set; } = default!;
    public string CreatedByUsername { get; set; } = default!;
    public string Status { get; set; } = default!;
    public List<Question>? Questions { get; set; }
    public List<string> Tags { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public string? Error { get; set; }
    public List<LeaderboardEntry> Leaderboard { get; set; } = [];
}

public class LeaderboardEntry
{
    public string UserEmail { get; set; } = default!;
    public string Username { get; set; } = default!;
    public int Score { get; set; }
    public DateTime CompletedAt { get; set; }
}
