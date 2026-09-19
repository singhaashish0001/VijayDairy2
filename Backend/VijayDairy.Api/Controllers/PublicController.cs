using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VijayDairy.Application.Managements.InvoiceManagement.Queries.GetPublicInvoice;

namespace VijayDairy.Api.Controllers;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicController : ControllerBase
{
    private readonly IMediator _mediator;

    public PublicController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("invoices/{id:guid}")]
    public async Task<ActionResult> GetInvoice(Guid id)
    {
        return Ok(await _mediator.Send(new GetPublicInvoiceQuery { Id = id }));
    }
}
