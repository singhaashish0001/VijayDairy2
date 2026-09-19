using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Common.Enums;
using VijayDairy.Common.Exceptions;
using VijayDairy.Common.Utility;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.InvoiceManagement.Commands.DeleteInvoice;

public class DeleteInvoiceHandler : IRequestHandler<DeleteInvoiceCommand, ResponseModel>
{
    private readonly IInvoiceRepository _invoiceRepository;

    public DeleteInvoiceHandler(IInvoiceRepository invoiceRepository)
    {
        _invoiceRepository = invoiceRepository;
    }

    public async Task<ResponseModel> Handle(DeleteInvoiceCommand request, CancellationToken cancellationToken)
    {
        var deleted = await _invoiceRepository.DeleteAsync(request.Id);
        if (!deleted)
            throw new NotFoundException(ErrorMessages.RecordNotFound.ToString(), ErrorMessages.RecordNotFound.GetEnumDescription());

        return new ResponseModel
        {
            Error = false,
            StatusCode = 200,
            MessageId = SuccessMessages.DeleteSuccess.ToString(),
            MessageText = SuccessMessages.DeleteSuccess.GetEnumDescription(),
        };
    }
}
