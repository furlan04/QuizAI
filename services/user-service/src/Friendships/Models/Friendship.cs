namespace UserService.Friendships.Models;

public class Friendship
{
    public string Id { get; set; } = default!;
    public string RequesterId { get; set; } = default!;
    public string AddresseeId { get; set; } = default!;
    public string Status { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
