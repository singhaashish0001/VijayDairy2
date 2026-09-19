using System;
using System.Linq;

namespace VijayDairy.Domain.Entities;

public static class ProductUnits
{
    public static readonly string[] Allowed = { "LTR", "KG", "PCS" };
    public static bool IsValid(string? unit) => unit is not null && Allowed.Contains(unit.Trim().ToUpperInvariant());
}

public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Unit { get; set; } = "";
    public decimal Price { get; set; }
    public decimal Stock { get; set; }
    public decimal LowStockThreshold { get; set; }
    public DateTime CreatedAt { get; set; }
}
