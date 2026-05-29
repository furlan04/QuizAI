using MongoDB.Driver;
using QuizService.Quizzes;
using QuizService.Sessions.Models;
using QuizService.Users;
using QuizService.Users.Models;

namespace QuizService.Sessions;

public class SessionService : ISessionService
{
    private readonly ISessionRepository _sessions;
    private readonly IQuizRepository _quizzes;
    private readonly IUserRepository _users;
    private readonly IMongoClient _mongoClient;
    private readonly IMongoDatabase _db;

    public SessionService(
        ISessionRepository sessions,
        IQuizRepository quizzes,
        IUserRepository users,
        IMongoClient mongoClient,
        IMongoDatabase db)
    {
        _sessions = sessions;
        _quizzes = quizzes;
        _users = users;
        _mongoClient = mongoClient;
        _db = db;
    }

    public async Task<CreateSessionResponse> CreateAsync(string quizId, string userId)
    {
        var quiz = await _quizzes.GetByIdAsync(quizId)
            ?? throw new KeyNotFoundException("Quiz not found.");

        if (quiz.Status != "ready")
            throw new InvalidOperationException($"Quiz is not ready (status: {quiz.Status}).");

        var session = new Session
        {
            QuizId = quizId,
            UserId = userId,
            Status = "in_progress",
            StartedAt = DateTime.UtcNow,
        };

        var sessionId = await _sessions.CreateAsync(session);

        var questions = quiz.Questions!.Select(q =>
            new QuestionDto(q.Text, q.Options)).ToList();

        return new CreateSessionResponse(sessionId, quizId, questions);
    }

    public async Task<AnswerResponse> AnswerAsync(
        string sessionId, string userId, int questionIndex, int selectedIndex)
    {
        var session = await _sessions.GetByIdAsync(sessionId)
            ?? throw new KeyNotFoundException("Session not found.");

        if (session.UserId != userId)
            throw new UnauthorizedAccessException("Not your session.");

        if (session.Status != "in_progress")
            throw new InvalidOperationException("Session is already completed.");

        var quiz = await _quizzes.GetByIdAsync(session.QuizId)
            ?? throw new KeyNotFoundException("Quiz not found.");

        if (questionIndex < 0 || questionIndex >= quiz.Questions!.Count)
            throw new ArgumentOutOfRangeException(nameof(questionIndex));

        var question = quiz.Questions[questionIndex];
        var isCorrect = selectedIndex == question.CorrectIndex;

        var answer = new Answer
        {
            QuestionIndex = questionIndex,
            SelectedIndex = selectedIndex,
            IsCorrect = isCorrect,
            AnsweredAt = DateTime.UtcNow,
        };

        await _sessions.AddAnswerAsync(sessionId, answer);

        return new AnswerResponse(isCorrect, question.CorrectIndex, question.Explanation);
    }

    public async Task<CompleteResponse> CompleteAsync(
        string sessionId, string userId, string userEmail, string username)
    {
        var session = await _sessions.GetByIdAsync(sessionId)
            ?? throw new KeyNotFoundException("Session not found.");

        if (session.UserId != userId)
            throw new UnauthorizedAccessException("Not your session.");

        if (session.Status != "in_progress")
            throw new InvalidOperationException("Session is already completed.");

        var quiz = await _quizzes.GetByIdAsync(session.QuizId)
            ?? throw new KeyNotFoundException("Quiz not found.");

        var totalQuestions = quiz.Questions!.Count;
        var score = session.Answers.Count(a => a.IsCorrect);
        var completedAt = DateTime.UtcNow;

        // Atomic transaction: update session + users.attempts + quizzes.leaderboard
        using var txSession = await _mongoClient.StartSessionAsync();
        txSession.StartTransaction();
        try
        {
            var sessionsCol = _db.GetCollection<Session>("sessions");
            var usersCol = _db.GetCollection<UserMongo>("users");
            var quizzesCol = _db.GetCollection<QuizMongo>("quizzes");

            await sessionsCol.UpdateOneAsync(txSession,
                s => s.Id == sessionId,
                Builders<Session>.Update
                    .Set(s => s.Status, "completed")
                    .Set(s => s.Score, score)
                    .Set(s => s.CompletedAt, completedAt));

            var attempt = new UserAttemptDoc
            {
                QuizId = session.QuizId,
                Score = score,
                CompletedAt = completedAt,
                Answers = session.Answers.Select(a => new AttemptAnswerDoc
                {
                    QuestionIndex = a.QuestionIndex,
                    SelectedIndex = a.SelectedIndex,
                    IsCorrect = a.IsCorrect,
                }).ToList(),
            };

            await usersCol.UpdateOneAsync(txSession,
                u => u.Id == userId,
                Builders<UserMongo>.Update.Push(u => u.Attempts, attempt));

            var entry = new LeaderboardEntryDoc
            {
                UserEmail = userEmail,
                Username = username,
                Score = score,
                CompletedAt = completedAt,
            };

            await quizzesCol.UpdateOneAsync(txSession,
                q => q.Id == session.QuizId,
                Builders<QuizMongo>.Update.Push(q => q.Leaderboard, entry));

            await txSession.CommitTransactionAsync();
        }
        catch
        {
            await txSession.AbortTransactionAsync();
            throw;
        }

        var percentage = totalQuestions > 0
            ? Math.Round((double)score / totalQuestions * 100, 2)
            : 0;

        return new CompleteResponse(score, totalQuestions, percentage);
    }

    public async Task<SessionDetail> GetAsync(string sessionId, string userId)
    {
        var session = await _sessions.GetByIdAsync(sessionId)
            ?? throw new KeyNotFoundException("Session not found.");

        if (session.UserId != userId)
            throw new UnauthorizedAccessException("Not your session.");

        return new SessionDetail(
            session.Id,
            session.QuizId,
            session.UserId,
            session.Status,
            session.Score,
            session.StartedAt,
            session.CompletedAt,
            session.Answers.Select(a => new AnswerDetail(
                a.QuestionIndex, a.SelectedIndex, a.IsCorrect, a.AnsweredAt
            )).ToList());
    }
}

// Minimal projection types for transaction writes (avoid cross-namespace circular deps)
file class UserMongo
{
    [MongoDB.Bson.Serialization.Attributes.BsonId]
    public string Id { get; set; } = default!;

    [MongoDB.Bson.Serialization.Attributes.BsonElement("attempts")]
    public List<UserAttemptDoc> Attempts { get; set; } = [];
}

file class UserAttemptDoc
{
    [MongoDB.Bson.Serialization.Attributes.BsonElement("quiz_id")]
    public string QuizId { get; set; } = default!;

    [MongoDB.Bson.Serialization.Attributes.BsonElement("score")]
    public int Score { get; set; }

    [MongoDB.Bson.Serialization.Attributes.BsonElement("completed_at")]
    public DateTime CompletedAt { get; set; }

    [MongoDB.Bson.Serialization.Attributes.BsonElement("answers")]
    public List<AttemptAnswerDoc> Answers { get; set; } = [];
}

file class AttemptAnswerDoc
{
    [MongoDB.Bson.Serialization.Attributes.BsonElement("question_index")]
    public int QuestionIndex { get; set; }

    [MongoDB.Bson.Serialization.Attributes.BsonElement("selected_index")]
    public int SelectedIndex { get; set; }

    [MongoDB.Bson.Serialization.Attributes.BsonElement("is_correct")]
    public bool IsCorrect { get; set; }
}

file class QuizMongo
{
    [MongoDB.Bson.Serialization.Attributes.BsonId]
    [MongoDB.Bson.Serialization.Attributes.BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    [MongoDB.Bson.Serialization.Attributes.BsonElement("leaderboard")]
    public List<LeaderboardEntryDoc> Leaderboard { get; set; } = [];
}

file class LeaderboardEntryDoc
{
    [MongoDB.Bson.Serialization.Attributes.BsonElement("user_email")]
    public string UserEmail { get; set; } = default!;

    [MongoDB.Bson.Serialization.Attributes.BsonElement("username")]
    public string Username { get; set; } = default!;

    [MongoDB.Bson.Serialization.Attributes.BsonElement("score")]
    public int Score { get; set; }

    [MongoDB.Bson.Serialization.Attributes.BsonElement("completed_at")]
    public DateTime CompletedAt { get; set; }
}
