namespace UserService.Challenges.Models;

public class Challenge
{
    public string Id { get; set; } = default!;
    public string ChallengerId { get; set; } = default!;
    public string ChallengedId { get; set; } = default!;
    public string QuizId { get; set; } = default!;
    public string Status { get; set; } = default!;
    public int? ChallengerScore { get; set; }
    public int? ChallengedScore { get; set; }
    public string? WinnerId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
