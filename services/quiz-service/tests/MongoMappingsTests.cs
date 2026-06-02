using FluentAssertions;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.IdGenerators;
using QuizService.Persistence;
using QuizService.Quizzes.Models;
using QuizService.Sessions.Models;
using Xunit;

namespace QuizService.Tests;

/// <summary>
/// Regressione: dopo aver tolto gli attributi [Bson*] dal dominio, le mappature a
/// runtime devono comunque (a) generare un ObjectId all'insert per gli id stringa
/// rappresentati come ObjectId e (b) usare i nomi degli elementi in snake_case.
/// Senza il generatore, l'insert di Session creava un _id non valido e impediva di
/// giocare ai quiz.
/// </summary>
public class MongoMappingsTests
{
    public MongoMappingsTests() => MongoMappings.Register();

    [Theory]
    [InlineData(typeof(Quiz))]
    [InlineData(typeof(Session))]
    public void Entities_with_objectid_string_id_have_a_string_objectid_generator(System.Type entity)
    {
        var classMap = BsonClassMap.LookupClassMap(entity);

        classMap.IdMemberMap.Should().NotBeNull();
        classMap.IdMemberMap!.IdGenerator.Should().BeOfType<StringObjectIdGenerator>(
            "un id stringa mappato come ObjectId deve auto-generarsi all'insert");
    }

    [Fact]
    public void Session_elements_use_snake_case_and_id_maps_to_underscore_id()
    {
        var classMap = BsonClassMap.LookupClassMap(typeof(Session));

        classMap.IdMemberMap!.ElementName.Should().Be("_id");
        classMap.GetMemberMap(nameof(Session.QuizId))!.ElementName.Should().Be("quiz_id");
        classMap.GetMemberMap(nameof(Session.CompletedAt))!.ElementName.Should().Be("completed_at");
    }
}
