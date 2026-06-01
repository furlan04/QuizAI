using UserService.Challenges.Models;

namespace UserService.Challenges;

public interface IChallengeRepository
{
    Task<string> CreateAsync(Challenge challenge);
    Task<Challenge?> GetByIdAsync(string id);
    Task<List<Challenge>> GetUserChallengesAsync(string userId, string? status);
    Task<Challenge?> GetPendingBetweenUsersForQuizAsync(string userId1, string userId2, string quizId);
    Task<Challenge?> GetAcceptedByUserAndQuizAsync(string userId, string quizId);
    Task UpdateStatusAsync(string id, string status);
    Task UpdateScoreAsync(string id, bool isChallenger, int score);
    Task CompleteAsync(string id, string? winnerId);
}
