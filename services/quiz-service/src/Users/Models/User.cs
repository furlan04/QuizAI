namespace QuizService.Users.Models;

public class User
{
    public string Id { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
    public List<UserAttempt> Attempts { get; set; } = [];
}

public class UserAttempt
{
    public string QuizId { get; set; } = default!;
    public int Score { get; set; }
    public DateTime CompletedAt { get; set; }
    public List<AttemptAnswer> Answers { get; set; } = [];
}

public class AttemptAnswer
{
    public int QuestionIndex { get; set; }
    public int SelectedIndex { get; set; }
    public bool IsCorrect { get; set; }
}
