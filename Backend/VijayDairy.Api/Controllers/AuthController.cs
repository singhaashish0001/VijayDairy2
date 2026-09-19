using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VijayDairy.Application.Managements.AuthManagement.Commands.Login;
using VijayDairy.Application.Managements.AuthManagement.Queries.Me;

namespace VijayDairy.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult> Login([FromBody] LoginCommand command)
    {
        return Ok(await _mediator.Send(command));
    }

    [HttpGet("me")]
    public async Task<ActionResult> Me()
    {
        return Ok(await _mediator.Send(new MeQuery()));
    }

    [HttpPost("logout")]
    public ActionResult Logout()
    {
        return Ok(new { message = "Logged out" });
    }
}
