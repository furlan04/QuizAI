using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace UserService.Challenges.Models;

public class Challenge
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    [BsonElement("challenger_id")]
    public string ChallengerId { get; set; } = default!;

    [BsonElement("challenged_id")]
    public string ChallengedId { get; set; } = default!;

    [BsonElement("quiz_id")]
    public string QuizId { get; set; } = default!;

    [BsonElement("status")]
    public string Status { get; set; } = default!;

    [BsonElement("challenger_score")]
    public int? ChallengerScore { get; set; }

    [BsonElement("challenged_score")]
    public int? ChallengedScore { get; set; }

    [BsonElement("winner_id")]
    public string? WinnerId { get; set; }

    [BsonElement("created_at")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
