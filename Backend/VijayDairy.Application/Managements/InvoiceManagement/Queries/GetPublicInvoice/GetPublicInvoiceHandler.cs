using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Application.Helpers;
using VijayDairy.Common.Enums;
using VijayDairy.Common.Exceptions;
using VijayDairy.Common.Utility;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Settings;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.InvoiceManagement.Queries.GetPublicInvoice;

public class GetPublicInvoiceHandler : IRequestHandler<GetPublicInvoiceQuery, ResponseModel<PublicInvoiceVM>>
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly ISettingsRepository _settingsRepository;

    public GetPublicInvoiceHandler(IInvoiceRepository invoiceRepository, ISettingsRepository settingsRepository)
    {
        _invoiceRepository = invoiceRepository;
        _settingsRepository = settingsRepository;
    }

    public async Task<ResponseModel<PublicInvoiceVM>> Handle(GetPublicInvoiceQuery request, CancellationToken cancellationToken)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(request.Id);
        if (invoice is null)
            throw new NotFoundException(ErrorMessages.RecordNotFound.ToString(), ErrorMessages.RecordNotFound.GetEnumDescription());

        var settings = await _settingsRepository.GetAsync();

        return new ResponseModel<PublicInvoiceVM>
        {
            Error = false,
            StatusCode = 200,
            Data = new PublicInvoiceVM
            {
                Invoice = invoice.ToVM(),
                // Deliberately omits InventoryEnabled — the public share link must not expose it.
                Settings = new PublicSettingsVM
                {
                    ShopName = settings.ShopName,
                    Address = settings.Address,
                    Phone = settings.Phone,
                    GstNumber = settings.GstNumber,
                    FooterNote = settings.FooterNote,
                },
            },
        };
    }
}
