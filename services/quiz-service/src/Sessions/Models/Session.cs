namespace QuizService.Sessions.Models;

public class Session
{
    public string Id { get; set; } = default!;
    public string QuizId { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public string Status { get; set; } = default!;
    public int Score { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<Answer> Answers { get; set; } = [];
}

public class Answer
{
    public int QuestionIndex { get; set; }
    public int SelectedIndex { get; set; }
    public bool IsCorrect { get; set; }
    public DateTime AnsweredAt { get; set; }
}
