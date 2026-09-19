using System;
using System.Collections.Generic;

namespace VijayDairy.Domain.Models.Invoice;

public class InvoiceItemVM
{
    public string ProductId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Unit { get; set; } = "";
    public decimal Price { get; set; }
    public decimal Quantity { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public decimal Amount { get; set; }
    public string SellingMode { get; set; } = "QUANTITY";
}

public class InvoiceVM
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = "";
    public List<InvoiceItemVM> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal TaxPercent { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }
    public string Notes { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
