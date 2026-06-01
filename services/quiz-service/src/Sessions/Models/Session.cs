using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace QuizService.Sessions.Models;

public class Session
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    [BsonElement("quiz_id")]
    public string QuizId { get; set; } = default!;

    [BsonElement("user_id")]
    public string UserId { get; set; } = default!;

    [BsonElement("status")]
    public string Status { get; set; } = default!;

    [BsonElement("score")]
    public int Score { get; set; }

    [BsonElement("started_at")]
    public DateTime StartedAt { get; set; }

    [BsonElement("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [BsonElement("answers")]
    public List<Answer> Answers { get; set; } = [];
}

public class Answer
{
    [BsonElement("question_index")]
    public int QuestionIndex { get; set; }

    [BsonElement("selected_index")]
    public int SelectedIndex { get; set; }

    [BsonElement("is_correct")]
    public bool IsCorrect { get; set; }

    [BsonElement("answered_at")]
    public DateTime AnsweredAt { get; set; }
}
