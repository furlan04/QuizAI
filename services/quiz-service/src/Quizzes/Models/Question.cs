using MongoDB.Bson.Serialization.Attributes;

namespace QuizService.Quizzes.Models;

public class Question
{
    [BsonElement("text")]
    public string Text { get; set; } = default!;

    [BsonElement("options")]
    public List<string> Options { get; set; } = [];

    [BsonElement("correct_index")]
    public int CorrectIndex { get; set; }

    [BsonElement("explanation")]
    public string Explanation { get; set; } = default!;
}
