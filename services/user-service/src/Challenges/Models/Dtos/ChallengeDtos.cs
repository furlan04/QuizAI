using System.ComponentModel.DataAnnotations;

namespace UserService.Challenges.Models.Dtos;

public record CreateChallengeRequest(
    [Required] string Username,
    [Required] string QuizId
);

public record RespondChallengeRequest(
    [Required][RegularExpression("^(accept|reject)$")] string Action
);

public record CreateChallengeResponse(string ChallengeId, string Status);

public record RespondChallengeResponse(string ChallengeId, string Status);

public record ChallengeResponse(
    string ChallengeId,
    string ChallengerId,
    string ChallengedId,
    string QuizId,
    string Status,
    int? ChallengerScore,
    int? ChallengedScore,
    string? WinnerId,
    DateTime CreatedAt
);
