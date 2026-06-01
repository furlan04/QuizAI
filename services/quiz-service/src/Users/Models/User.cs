using MongoDB.Bson.Serialization.Attributes;

namespace QuizService.Users.Models;

public class User
{
    [BsonId]
    public string Id { get; set; } = default!;

    [BsonElement("username")]
    public string Username { get; set; } = default!;

    [BsonElement("email")]
    public string Email { get; set; } = default!;

    [BsonElement("password_hash")]
    public string PasswordHash { get; set; } = default!;

    [BsonElement("created_at")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("attempts")]
    public List<UserAttempt> Attempts { get; set; } = [];
}

public class UserAttempt
{
    [BsonElement("quiz_id")]
    public string QuizId { get; set; } = default!;

    [BsonElement("score")]
    public int Score { get; set; }

    [BsonElement("completed_at")]
    public DateTime CompletedAt { get; set; }

    [BsonElement("answers")]
    public List<AttemptAnswer> Answers { get; set; } = [];
}

public class AttemptAnswer
{
    [BsonElement("question_index")]
    public int QuestionIndex { get; set; }

    [BsonElement("selected_index")]
    public int SelectedIndex { get; set; }

    [BsonElement("is_correct")]
    public bool IsCorrect { get; set; }
}
