using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Application.Helpers;
using VijayDairy.Common.Enums;
using VijayDairy.Common.Exceptions;
using VijayDairy.Common.Utility;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Invoice;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.InvoiceManagement.Queries.GetInvoiceById;

public class GetInvoiceByIdHandler : IRequestHandler<GetInvoiceByIdQuery, ResponseModel<InvoiceVM>>
{
    private readonly IInvoiceRepository _invoiceRepository;

    public GetInvoiceByIdHandler(IInvoiceRepository invoiceRepository)
    {
        _invoiceRepository = invoiceRepository;
    }

    public async Task<ResponseModel<InvoiceVM>> Handle(GetInvoiceByIdQuery request, CancellationToken cancellationToken)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(request.Id);
        if (invoice is null)
            throw new NotFoundException(ErrorMessages.RecordNotFound.ToString(), ErrorMessages.RecordNotFound.GetEnumDescription());

        return new ResponseModel<InvoiceVM> { Error = false, StatusCode = 200, Data = invoice.ToVM() };
    }
}
