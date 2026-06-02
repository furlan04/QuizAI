using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace QuizService.Quizzes.Models;

public class Quiz
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    [BsonElement("title")]
    public string Title { get; set; } = default!;

    [BsonElement("topic")]
    public string Topic { get; set; } = default!;

    [BsonElement("difficulty")]
    public string Difficulty { get; set; } = default!;

    [BsonElement("num_questions")]
    public int NumQuestions { get; set; }

    [BsonElement("created_by")]
    public string CreatedBy { get; set; } = default!;

    [BsonElement("created_by_username")]
    public string CreatedByUsername { get; set; } = default!;

    [BsonElement("status")]
    public string Status { get; set; } = default!;

    [BsonElement("questions")]
    public List<Question>? Questions { get; set; }

    [BsonElement("tags")]
    public List<string> Tags { get; set; } = [];

    [BsonElement("created_at")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("error")]
    public string? Error { get; set; }

    [BsonElement("leaderboard")]
    public List<LeaderboardEntry> Leaderboard { get; set; } = [];
}

public class LeaderboardEntry
{
    [BsonElement("user_email")]
    public string UserEmail { get; set; } = default!;

    [BsonElement("username")]
    public string Username { get; set; } = default!;

    [BsonElement("score")]
    public int Score { get; set; }

    [BsonElement("completed_at")]
    public DateTime CompletedAt { get; set; }
}
