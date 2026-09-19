using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Domain.Entities;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Settings;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.SettingsManagement.Commands.UpdateSettings;

public class UpdateSettingsHandler : IRequestHandler<UpdateSettingsCommand, ResponseModel<SettingsVM>>
{
    private readonly ISettingsRepository _settingsRepository;

    public UpdateSettingsHandler(ISettingsRepository settingsRepository)
    {
        _settingsRepository = settingsRepository;
    }

    public async Task<ResponseModel<SettingsVM>> Handle(UpdateSettingsCommand request, CancellationToken cancellationToken)
    {
        var updated = await _settingsRepository.UpsertAsync(new BusinessSettings
        {
            ShopName = request.ShopName,
            Address = request.Address ?? "",
            Phone = request.Phone ?? "",
            GstNumber = request.GstNumber ?? "",
            FooterNote = string.IsNullOrWhiteSpace(request.FooterNote) ? "Thank you for your business!" : request.FooterNote,
            InventoryEnabled = request.InventoryEnabled,
        });

        return new ResponseModel<SettingsVM>
        {
            Error = false,
            StatusCode = 200,
            Data = new SettingsVM
            {
                Id = updated.Id,
                ShopName = updated.ShopName,
                Address = updated.Address,
                Phone = updated.Phone,
                GstNumber = updated.GstNumber,
                FooterNote = updated.FooterNote,
                InventoryEnabled = updated.InventoryEnabled,
            },
        };
    }
}
