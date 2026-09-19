using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Dashboard;

namespace VijayDairy.Application.Managements.DashboardManagement.Queries.GetDashboardStats;

public class GetDashboardStatsQuery : IRequest<ResponseModel<DashboardStatsVM>>
{
}
