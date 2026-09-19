using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using VijayDairy.Application.Managements.DashboardManagement.Queries.GetDashboardStats;

namespace VijayDairy.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("stats")]
    public async Task<ActionResult> Stats()
    {
        return Ok(await _mediator.Send(new GetDashboardStatsQuery()));
    }
}
