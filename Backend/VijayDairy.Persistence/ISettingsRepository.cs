using System.Threading.Tasks;
using VijayDairy.Domain.Entities;

namespace VijayDairy.Persistence;

public interface ISettingsRepository
{
    Task<BusinessSettings> GetAsync();
    Task<BusinessSettings> UpsertAsync(BusinessSettings settings);
}
