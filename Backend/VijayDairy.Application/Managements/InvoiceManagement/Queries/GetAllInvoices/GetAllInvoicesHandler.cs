using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Application.Helpers;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Invoice;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.InvoiceManagement.Queries.GetAllInvoices;

public class GetAllInvoicesHandler : IRequestHandler<GetAllInvoicesQuery, ResponseModel<List<InvoiceVM>>>
{
    private readonly IInvoiceRepository _invoiceRepository;

    public GetAllInvoicesHandler(IInvoiceRepository invoiceRepository)
    {
        _invoiceRepository = invoiceRepository;
    }

    public async Task<ResponseModel<List<InvoiceVM>>> Handle(GetAllInvoicesQuery request, CancellationToken cancellationToken)
    {
        var invoices = await _invoiceRepository.GetAllAsync();
        return new ResponseModel<List<InvoiceVM>> { Error = false, StatusCode = 200, Data = invoices.Select(i => i.ToVM()).ToList() };
    }
}
