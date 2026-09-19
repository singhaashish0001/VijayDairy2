using MediatR;
using VijayDairy.Domain.Models.Auth;
using VijayDairy.Domain.Models.Common;

namespace VijayDairy.Application.Managements.AuthManagement.Queries.Me;

public class MeQuery : IRequest<ResponseModel<UserVM>>
{
}
