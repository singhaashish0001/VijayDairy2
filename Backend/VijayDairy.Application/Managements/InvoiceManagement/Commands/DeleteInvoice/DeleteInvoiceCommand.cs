using System;
using MediatR;
using VijayDairy.Domain.Models.Common;

namespace VijayDairy.Application.Managements.InvoiceManagement.Commands.DeleteInvoice;

public class DeleteInvoiceCommand : IRequest<ResponseModel>
{
    public Guid Id { get; set; }
}
