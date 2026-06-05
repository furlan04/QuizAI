namespace QuizService.Quizzes.Models;

public class Question
{
    public string Text { get; set; } = default!;
    public List<string> Options { get; set; } = [];
    public int CorrectIndex { get; set; }
    public string Explanation { get; set; } = default!;
}
