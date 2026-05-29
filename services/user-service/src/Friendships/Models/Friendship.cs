using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace UserService.Friendships.Models;

public class Friendship
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    [BsonElement("requester_id")]
    public string RequesterId { get; set; } = default!;

    [BsonElement("addressee_id")]
    public string AddresseeId { get; set; } = default!;

    [BsonElement("status")]
    public string Status { get; set; } = default!;

    [BsonElement("created_at")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
