using System;
using System.Collections.Generic;

namespace VijayDairy.Domain.Entities;

public class InvoiceItem
{
    public string ProductId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Unit { get; set; } = "";
    public decimal Price { get; set; }
    public decimal Quantity { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    /// <summary>Gross line amount (Price x Quantity, before the line Discount). 0 on invoices saved before selling modes existed.</summary>
    public decimal Amount { get; set; }
    /// <summary>"QUANTITY" or "AMOUNT" — how the cashier entered the line.</summary>
    public string SellingMode { get; set; } = "QUANTITY";
}

public class Invoice
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = "";
    public List<InvoiceItem> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal TaxPercent { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }
    public string Notes { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
