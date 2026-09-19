using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using VijayDairy.Application.Managements.InvoiceManagement.Commands.AddInvoice;
using VijayDairy.Application.Managements.InvoiceManagement.Commands.DeleteInvoice;
using VijayDairy.Application.Managements.InvoiceManagement.Queries.GetAllInvoices;
using VijayDairy.Application.Managements.InvoiceManagement.Queries.GetInvoiceById;

namespace VijayDairy.Api.Controllers;

[ApiController]
[Route("api/invoices")]
public class InvoiceController : ControllerBase
{
    private readonly IMediator _mediator;

    public InvoiceController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        return Ok(await _mediator.Send(new GetAllInvoicesQuery()));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        return Ok(await _mediator.Send(new GetInvoiceByIdQuery { Id = id }));
    }

    [HttpPost]
    public async Task<ActionResult> Add([FromBody] AddInvoiceCommand command)
    {
        return Ok(await _mediator.Send(command));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        return Ok(await _mediator.Send(new DeleteInvoiceCommand { Id = id }));
    }
}
