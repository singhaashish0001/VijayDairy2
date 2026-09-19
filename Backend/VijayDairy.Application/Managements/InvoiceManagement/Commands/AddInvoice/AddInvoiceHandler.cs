using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Application.Helpers;
using VijayDairy.Domain.Entities;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Invoice;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.InvoiceManagement.Commands.AddInvoice;

public class AddInvoiceHandler : IRequestHandler<AddInvoiceCommand, ResponseModel<InvoiceVM>>
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly ISettingsRepository _settingsRepository;

    public AddInvoiceHandler(IInvoiceRepository invoiceRepository, ISettingsRepository settingsRepository)
    {
        _invoiceRepository = invoiceRepository;
        _settingsRepository = settingsRepository;
    }

    public async Task<ResponseModel<InvoiceVM>> Handle(AddInvoiceCommand request, CancellationToken cancellationToken)
    {
        var items = request.Items.Select(i =>
        {
            // Quantity/amount are always derived from the rate (validated upstream); client-sent totals are ignored.
            var line = InvoiceLineCalculator.Calculate(i.Unit, i.Price, i.SellingMode, InvoiceLineCalculator.EnteredValue(i));
            var discount = i.Discount ?? 0;
            var lineTotal = Math.Max(0, Math.Round(line.Amount - discount, 2));
            return new InvoiceItem
            {
                ProductId = i.ProductId,
                Name = i.Name,
                Unit = i.Unit,
                Price = i.Price,
                Quantity = line.Quantity,
                Discount = discount,
                Amount = line.Amount,
                SellingMode = line.SellingMode,
                Total = lineTotal,
            };
        }).ToList();

        var subtotal = Math.Round(items.Sum(i => i.Total), 2);
        var invoiceDiscount = Math.Round(request.Discount ?? 0, 2);
        var taxPercent = request.TaxPercent ?? 0;
        var taxAmount = Math.Round((subtotal - invoiceDiscount) * taxPercent / 100m, 2);
        var total = Math.Round(subtotal - invoiceDiscount + taxAmount, 2);

        var settings = await _settingsRepository.GetAsync();

        var invoice = new Invoice
        {
            Items = items,
            Subtotal = subtotal,
            Discount = invoiceDiscount,
            TaxPercent = taxPercent,
            TaxAmount = taxAmount,
            Total = total,
            Notes = request.Notes ?? "",
        };

        var created = await _invoiceRepository.CreateAsync(invoice, settings.InventoryEnabled);

        return new ResponseModel<InvoiceVM> { Error = false, StatusCode = 201, Data = created.ToVM() };
    }
}
