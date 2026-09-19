using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using VijayDairy.Application.Managements.SettingsManagement.Commands.UpdateSettings;
using VijayDairy.Application.Managements.SettingsManagement.Queries.GetSettings;

namespace VijayDairy.Api.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SettingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult> Get()
    {
        return Ok(await _mediator.Send(new GetSettingsQuery()));
    }

    [HttpPut]
    public async Task<ActionResult> Update([FromBody] UpdateSettingsCommand command)
    {
        return Ok(await _mediator.Send(command));
    }
}
