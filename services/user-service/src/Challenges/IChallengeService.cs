using UserService.Challenges.Models.Dtos;

namespace UserService.Challenges;

public interface IChallengeService
{
    Task<List<ChallengeResponse>> GetChallengesAsync(string userId, string? status);
    Task<CreateChallengeResponse> CreateAsync(string challengerId, string targetUsername, string quizId);
    Task<RespondChallengeResponse> RespondAsync(string challengeId, string userId, string action);
}
