using System;
using System.Collections.Generic;

namespace VijayDairy.Domain.Models.Product;

public class ProductVM
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Unit { get; set; } = "";
    public decimal Price { get; set; }
    public decimal Stock { get; set; }
    public decimal LowStockThreshold { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BulkImportRowErrorVM
{
    public int Row { get; set; }
    public string Error { get; set; } = "";
}

public class BulkImportResultVM
{
    public int Created { get; set; }
    public int Updated { get; set; }
    public int Total { get; set; }
    public List<BulkImportRowErrorVM> Errors { get; set; } = new();
}
