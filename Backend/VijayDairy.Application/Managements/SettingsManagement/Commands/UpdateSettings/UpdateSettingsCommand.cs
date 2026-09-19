using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Settings;

namespace VijayDairy.Application.Managements.SettingsManagement.Commands.UpdateSettings;

public class UpdateSettingsCommand : IRequest<ResponseModel<SettingsVM>>
{
    public string ShopName { get; set; } = "";
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? GstNumber { get; set; }
    public string? FooterNote { get; set; }
    public bool InventoryEnabled { get; set; }
}
