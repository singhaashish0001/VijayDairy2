using System.IO;
using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Product;

namespace VijayDairy.Application.Managements.ProductManagement.Commands.ImportStock;

public static class StockImportModes
{
    /// <summary>The CSV value becomes the product's stock (must be requested explicitly).</summary>
    public const string Set = "SET";
    /// <summary>Default. The CSV value is added to the product's present stock (negative values subtract).</summary>
    public const string Add = "ADD";
}

/// <summary>Updates stock of EXISTING products from a CSV (name,stock). Never creates products.</summary>
public class ImportStockCommand : IRequest<ResponseModel<BulkImportResultVM>>
{
    public Stream FileStream { get; set; } = Stream.Null;
    public string? Mode { get; set; }
}
