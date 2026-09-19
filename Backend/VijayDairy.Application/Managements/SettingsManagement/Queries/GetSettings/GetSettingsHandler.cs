using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Settings;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.SettingsManagement.Queries.GetSettings;

public class GetSettingsHandler : IRequestHandler<GetSettingsQuery, ResponseModel<SettingsVM>>
{
    private readonly ISettingsRepository _settingsRepository;

    public GetSettingsHandler(ISettingsRepository settingsRepository)
    {
        _settingsRepository = settingsRepository;
    }

    public async Task<ResponseModel<SettingsVM>> Handle(GetSettingsQuery request, CancellationToken cancellationToken)
    {
        var settings = await _settingsRepository.GetAsync();
        return new ResponseModel<SettingsVM>
        {
            Error = false,
            StatusCode = 200,
            Data = new SettingsVM
            {
                Id = settings.Id,
                ShopName = settings.ShopName,
                Address = settings.Address,
                Phone = settings.Phone,
                GstNumber = settings.GstNumber,
                FooterNote = settings.FooterNote,
                InventoryEnabled = settings.InventoryEnabled,
            },
        };
    }
}
