using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Application.Interfaces;
using VijayDairy.Common.Enums;
using VijayDairy.Common.Exceptions;
using VijayDairy.Common.Utility;
using VijayDairy.Domain.Models.Auth;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.AuthManagement.Commands.Login;

public class LoginHandler : IRequestHandler<LoginCommand, ResponseModel<LoginResultVM>>
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;

    public LoginHandler(IUserRepository userRepository, ITokenService tokenService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
    }

    public async Task<ResponseModel<LoginResultVM>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new InvalidEmailOrPasswordException(
                ErrorMessages.InvalidEmailOrPassword.ToString(),
                ErrorMessages.InvalidEmailOrPassword.GetEnumDescription());

        var userVm = new UserVM { Id = user.Id, Email = user.Email, Name = user.Name, Role = user.Role };
        var token = _tokenService.CreateToken(userVm);

        return new ResponseModel<LoginResultVM>
        {
            Error = false,
            StatusCode = 200,
            Data = new LoginResultVM { Token = token, User = userVm },
        };
    }
}
