using System.Collections.Generic;
using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Invoice;

namespace VijayDairy.Application.Managements.InvoiceManagement.Commands.AddInvoice;

public class AddInvoiceItemCommand
{
    public string ProductId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Unit { get; set; } = "";
    public decimal Price { get; set; }
    public decimal Quantity { get; set; }
    public decimal? Discount { get; set; }
    public decimal? Total { get; set; }
    /// <summary>"QUANTITY" (default) or "AMOUNT". In AMOUNT mode, <see cref="Amount"/> is the entered value and Quantity is derived.</summary>
    public string? SellingMode { get; set; }
    public decimal? Amount { get; set; }
}

public class AddInvoiceCommand : IRequest<ResponseModel<InvoiceVM>>
{
    public List<AddInvoiceItemCommand> Items { get; set; } = new();
    public string? Notes { get; set; }
    public decimal? Discount { get; set; }
    public decimal? TaxPercent { get; set; }
}
