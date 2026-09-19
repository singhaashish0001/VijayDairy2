using System;
using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Invoice;

namespace VijayDairy.Application.Managements.InvoiceManagement.Queries.GetInvoiceById;

public class GetInvoiceByIdQuery : IRequest<ResponseModel<InvoiceVM>>
{
    public Guid Id { get; set; }
}
