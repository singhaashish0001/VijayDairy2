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

namespace VijayDairy.Application.Managements.AuthManagement.Queries.Me;

public class MeHandler : IRequestHandler<MeQuery, ResponseModel<UserVM>>
{
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public MeHandler(IUserRepository userRepository, ICurrentUserService currentUserService)
    {
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ResponseModel<UserVM>> Handle(MeQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(_currentUserService.GetUserId());
        if (user is null)
            throw new UnauthorizedException(ErrorMessages.Unauthorized.ToString(), ErrorMessages.Unauthorized.GetEnumDescription());

        return new ResponseModel<UserVM>
        {
            Error = false,
            StatusCode = 200,
            Data = new UserVM { Id = user.Id, Email = user.Email, Name = user.Name, Role = user.Role },
        };
    }
}
