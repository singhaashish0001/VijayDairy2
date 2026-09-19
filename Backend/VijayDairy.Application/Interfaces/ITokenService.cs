using VijayDairy.Domain.Models.Auth;

namespace VijayDairy.Application.Interfaces;

public interface ITokenService
{
    string CreateToken(UserVM user);
}
