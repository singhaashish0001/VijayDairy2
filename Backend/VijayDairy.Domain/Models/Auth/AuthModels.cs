using System;

namespace VijayDairy.Domain.Models.Auth;

public class UserVM
{
    public Guid Id { get; set; }
    public string Email { get; set; } = "";
    public string Name { get; set; } = "";
    public string Role { get; set; } = "";
}

public class LoginResultVM
{
    public string Token { get; set; } = "";
    public UserVM User { get; set; } = new();
}
