using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Bson.Serialization.Serializers;
using UserService.Challenges.Models;
using UserService.Friendships.Models;
using UserService.Notifications.Models;
using UserService.Users.Models;

namespace UserService.Persistence;

/// <summary>
/// Mappature MongoDB registrate a runtime così che le entità di dominio restino
/// pure (nessun attributo [Bson*]). Replica i vecchi attributi: nomi degli
/// elementi in snake_case e id stringa serializzati come ObjectId dove serviva.
/// Va invocato una sola volta all'avvio, prima di qualunque accesso alle collection.
/// </summary>
public static class MongoMappings
{
    private static bool _registered;

    public static void Register()
    {
        if (_registered) return;
        _registered = true;

        MapSnakeCase<Challenge>(cm => ConfigureObjectIdStringId(cm.IdMemberMap));
        MapSnakeCase<Friendship>(cm => ConfigureObjectIdStringId(cm.IdMemberMap));
        MapSnakeCase<Notification>(cm => ConfigureObjectIdStringId(cm.IdMemberMap));
        MapSnakeCase<User>();            // Id stringa così com'è (nessuna rappresentazione ObjectId)
    }

    // Id stringa rappresentato come ObjectId: ripristina anche il generatore che
    // l'attributo [BsonRepresentation(ObjectId)] assegnava in automatico, così
    // all'insert un id vuoto riceve un nuovo ObjectId.
    private static void ConfigureObjectIdStringId(BsonMemberMap idMember)
    {
        idMember
            .SetSerializer(new StringSerializer(BsonType.ObjectId))
            .SetIdGenerator(StringObjectIdGenerator.Instance);
    }

    private static void MapSnakeCase<T>(Action<BsonClassMap<T>>? configure = null)
    {
        BsonClassMap.RegisterClassMap<T>(cm =>
        {
            cm.AutoMap();
            foreach (var member in cm.DeclaredMemberMaps)
            {
                if (cm.IdMemberMap == member) continue; // l'id resta _id
                member.SetElementName(ToSnakeCase(member.MemberName));
            }
            configure?.Invoke(cm);
        });
    }

    private static string ToSnakeCase(string name)
    {
        var sb = new System.Text.StringBuilder(name.Length + 4);
        for (int i = 0; i < name.Length; i++)
        {
            char c = name[i];
            if (char.IsUpper(c))
            {
                if (i > 0) sb.Append('_');
                sb.Append(char.ToLowerInvariant(c));
            }
            else
            {
                sb.Append(c);
            }
        }
        return sb.ToString();
    }
}
