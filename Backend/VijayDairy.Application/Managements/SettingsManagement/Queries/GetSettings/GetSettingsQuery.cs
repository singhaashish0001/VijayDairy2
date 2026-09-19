using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Settings;

namespace VijayDairy.Application.Managements.SettingsManagement.Queries.GetSettings;

public class GetSettingsQuery : IRequest<ResponseModel<SettingsVM>>
{
}
