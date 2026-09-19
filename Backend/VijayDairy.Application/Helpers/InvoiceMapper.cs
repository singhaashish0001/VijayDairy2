using System.Linq;
using VijayDairy.Domain.Models.Invoice;

namespace VijayDairy.Application.Helpers;

public static class InvoiceMapper
{
    public static InvoiceVM ToVM(this Domain.Entities.Invoice invoice) => new()
    {
        Id = invoice.Id,
        InvoiceNumber = invoice.InvoiceNumber,
        Items = invoice.Items.Select(i => new InvoiceItemVM
        {
            ProductId = i.ProductId,
            Name = i.Name,
            Unit = i.Unit,
            Price = i.Price,
            Quantity = i.Quantity,
            Discount = i.Discount,
            Total = i.Total,
            // Invoices saved before selling modes existed have no stored Amount; it is the net total plus the line discount.
            Amount = i.Amount != 0 ? i.Amount : i.Total + i.Discount,
            SellingMode = string.IsNullOrEmpty(i.SellingMode) ? "QUANTITY" : i.SellingMode,
        }).ToList(),
        Subtotal = invoice.Subtotal,
        Discount = invoice.Discount,
        TaxPercent = invoice.TaxPercent,
        TaxAmount = invoice.TaxAmount,
        Total = invoice.Total,
        Notes = invoice.Notes,
        CreatedAt = invoice.CreatedAt,
    };
}
