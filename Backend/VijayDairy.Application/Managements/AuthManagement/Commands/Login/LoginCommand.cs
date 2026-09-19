using MediatR;
using VijayDairy.Domain.Models.Auth;
using VijayDairy.Domain.Models.Common;

namespace VijayDairy.Application.Managements.AuthManagement.Commands.Login;

public class LoginCommand : IRequest<ResponseModel<LoginResultVM>>
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}
