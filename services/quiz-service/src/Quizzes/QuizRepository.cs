using MongoDB.Bson;
using MongoDB.Driver;
using QuizService.Quizzes.Models;

namespace QuizService.Quizzes;

public class QuizRepository : IQuizRepository
{
    private readonly IMongoCollection<Quiz> _col;

    public QuizRepository(IMongoDatabase db)
        => _col = db.GetCollection<Quiz>("quizzes");

    public async Task<string> CreateAsync(Quiz quiz)
    {
        await _col.InsertOneAsync(quiz);
        return quiz.Id;
    }

    public Task<Quiz?> GetByIdAsync(string id)
    {
        if (!ObjectId.TryParse(id, out _)) return Task.FromResult<Quiz?>(null);
        return _col.Find(q => q.Id == id).FirstOrDefaultAsync()!;
    }

    public async Task<(List<Quiz> Items, long Total)> GetPagedAsync(
        string? topic, string? difficulty, int page, int pageSize)
    {
        var filter = Builders<Quiz>.Filter.Eq(q => q.Status, "ready");

        if (!string.IsNullOrWhiteSpace(topic))
            filter &= Builders<Quiz>.Filter.Regex(
                q => q.Topic, new BsonRegularExpression(topic, "i"));

        if (!string.IsNullOrWhiteSpace(difficulty))
            filter &= Builders<Quiz>.Filter.Eq(q => q.Difficulty, difficulty);

        var total = await _col.CountDocumentsAsync(filter);
        var items = await _col.Find(filter)
            .SortByDescending(q => q.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task UpdateFromGeneratedAsync(
        string id, string status, List<Question>? questions,
        List<string>? tags, string? error)
    {
        var update = Builders<Quiz>.Update.Set(q => q.Status, status);

        if (questions != null) update = update.Set(q => q.Questions, questions);
        if (tags != null)      update = update.Set(q => q.Tags, tags);
        if (error != null)     update = update.Set(q => q.Error, error);

        await _col.UpdateOneAsync(q => q.Id == id, update);
    }

    public async Task<Dictionary<string, string>> GetTitlesByIdsAsync(IEnumerable<string> ids)
    {
        var valid = ids.Where(id => ObjectId.TryParse(id, out _)).ToList();
        if (valid.Count == 0) return new Dictionary<string, string>();

        var filter = Builders<Quiz>.Filter.In(q => q.Id, valid);
        var projection = Builders<Quiz>.Projection.Include(q => q.Title).Include(q => q.Id);

        var docs = await _col.Find(filter).Project<Quiz>(projection).ToListAsync();
        return docs.ToDictionary(q => q.Id, q => q.Title);
    }
}
