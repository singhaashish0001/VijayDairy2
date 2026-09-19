using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Application.Helpers;
using VijayDairy.Domain.Entities;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Product;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.ProductManagement.Commands.BulkImportProducts;

public class BulkImportProductsHandler : IRequestHandler<BulkImportProductsCommand, ResponseModel<BulkImportResultVM>>
{
    private readonly IProductRepository _productRepository;

    public BulkImportProductsHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<ResponseModel<BulkImportResultVM>> Handle(BulkImportProductsCommand request, CancellationToken cancellationToken)
    {
        using var reader = new System.IO.StreamReader(request.FileStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        var content = await reader.ReadToEndAsync(cancellationToken);
        var lines = content.Replace("\r\n", "\n").Replace("\r", "\n")
            .Split('\n', System.StringSplitOptions.RemoveEmptyEntries);

        var result = new BulkImportResultVM();
        if (lines.Length == 0)
        {
            return new ResponseModel<BulkImportResultVM> { Error = false, StatusCode = 200, Data = result };
        }

        var delimiter = CsvLineParser.DetectDelimiter(lines[0]);
        var headers = CsvLineParser.Split(lines[0], delimiter).Select(h => h.Trim().ToLowerInvariant()).ToList();
        var required = new[] { "name", "unit", "price" };
        var missing = required.Where(r => !headers.Contains(r)).ToList();
        if (missing.Count > 0)
        {
            throw new VijayDairy.Common.Exceptions.ValidationException(
                $"Missing required columns: {string.Join(", ", missing)}. Found columns: {(headers.Count(h => h.Length > 0) == 0 ? "none" : string.Join(" | ", headers.Where(h => h.Length > 0).Take(8)))}",
                $"Missing required columns: {string.Join(", ", missing)}. Found columns: {(headers.Count(h => h.Length > 0) == 0 ? "none" : string.Join(" | ", headers.Where(h => h.Length > 0).Take(8)))}");
        }

        int nameIdx = headers.IndexOf("name");
        int unitIdx = headers.IndexOf("unit");
        int priceIdx = headers.IndexOf("price");
        int stockIdx = headers.IndexOf("stock");
        int thresholdIdx = headers.IndexOf("low_stock_threshold");

        for (int i = 1; i < lines.Length; i++)
        {
            var rowNum = i + 1;
            var cols = CsvLineParser.Split(lines[i], delimiter);
            if (CsvLineParser.IsBlankRow(cols)) continue;

            string name = GetCol(cols, nameIdx).Trim();
            string unit = GetCol(cols, unitIdx).Trim().ToUpperInvariant();
            string priceRaw = GetCol(cols, priceIdx).Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                result.Errors.Add(new BulkImportRowErrorVM { Row = rowNum, Error = "Missing name" });
                continue;
            }
            if (!ProductUnits.IsValid(unit))
            {
                result.Errors.Add(new BulkImportRowErrorVM { Row = rowNum, Error = $"Invalid unit '{unit}'. Allowed: LTR, KG, PCS" });
                continue;
            }
            if (!decimal.TryParse(priceRaw, NumberStyles.Number, CultureInfo.InvariantCulture, out var price) || price < 0)
            {
                result.Errors.Add(new BulkImportRowErrorVM { Row = rowNum, Error = $"Invalid price '{priceRaw}'" });
                continue;
            }

            decimal stock = 0;
            if (stockIdx >= 0) decimal.TryParse(GetCol(cols, stockIdx).Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out stock);

            decimal threshold = 0;
            if (thresholdIdx >= 0) decimal.TryParse(GetCol(cols, thresholdIdx).Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out threshold);

            var existing = await _productRepository.GetByNameAsync(name);
            if (existing is null)
            {
                await _productRepository.CreateAsync(new Product { Name = name, Unit = unit, Price = price, Stock = stock, LowStockThreshold = threshold });
                result.Created++;
            }
            else
            {
                var fields = new HashSet<string> { "unit", "price", "stock", "lowStockThreshold" };
                await _productRepository.UpdateAsync(existing.Id, new Product { Unit = unit, Price = price, Stock = stock, LowStockThreshold = threshold }, fields);
                result.Updated++;
            }
        }

        result.Total = result.Created + result.Updated;
        return new ResponseModel<BulkImportResultVM> { Error = false, StatusCode = 200, Data = result };
    }

    private static string GetCol(List<string> cols, int idx) => idx >= 0 && idx < cols.Count ? cols[idx] : "";
}
