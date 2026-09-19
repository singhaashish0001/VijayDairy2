using System.Threading.Tasks;
using VijayDairy.Domain.Entities;

namespace VijayDairy.Persistence;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(System.Guid id);
    Task<User> CreateAsync(User user);
}
