using Microsoft.AspNetCore.Identity;

namespace AuthService.Identity;

public class AppUser : IdentityUser
{
    public DateTime CreatedAt { get; set; }
}
