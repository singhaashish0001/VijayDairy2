using System.Collections.Generic;
using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Invoice;

namespace VijayDairy.Application.Managements.InvoiceManagement.Queries.GetAllInvoices;

public class GetAllInvoicesQuery : IRequest<ResponseModel<List<InvoiceVM>>>
{
}
