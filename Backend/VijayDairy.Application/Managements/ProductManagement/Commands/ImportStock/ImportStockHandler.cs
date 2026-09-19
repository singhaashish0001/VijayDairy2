using System;
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

namespace VijayDairy.Application.Managements.ProductManagement.Commands.ImportStock;

public class ImportStockHandler : IRequestHandler<ImportStockCommand, ResponseModel<BulkImportResultVM>>
{
    private readonly IProductRepository _productRepository;

    public ImportStockHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<ResponseModel<BulkImportResultVM>> Handle(ImportStockCommand request, CancellationToken cancellationToken)
    {
        // Default is ADD (add to the present stock); replacing stock must be asked for explicitly with mode=SET.
        var mode = string.Equals(request.Mode, StockImportModes.Set, StringComparison.OrdinalIgnoreCase) ? StockImportModes.Set : StockImportModes.Add;

        using var reader = new System.IO.StreamReader(request.FileStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        var content = await reader.ReadToEndAsync(cancellationToken);
        var lines = content.Replace("\r\n", "\n").Replace("\r", "\n").Split('\n', StringSplitOptions.RemoveEmptyEntries);

        var result = new BulkImportResultVM();
        if (lines.Length == 0)
        {
            return new ResponseModel<BulkImportResultVM> { Error = false, StatusCode = 200, Data = result };
        }

        var delimiter = CsvLineParser.DetectDelimiter(lines[0]);
        var headers = CsvLineParser.Split(lines[0], delimiter).Select(h => h.Trim().ToLowerInvariant()).ToList();
        var missing = new[] { "name", "stock" }.Where(r => !headers.Contains(r)).ToList();
        if (missing.Count > 0)
        {
            var message = $"Missing required columns: {string.Join(", ", missing)}. Found columns: {(headers.Count(h => h.Length > 0) == 0 ? "none" : string.Join(" | ", headers.Where(h => h.Length > 0).Take(8)))}";
            throw new VijayDairy.Common.Exceptions.ValidationException(message, message);
        }

        int nameIdx = headers.IndexOf("name");
        int stockIdx = headers.IndexOf("stock");
        // Optional column: when present, a blank cell means threshold 0. When absent, thresholds are left untouched.
        int thresholdIdx = headers.IndexOf("low_stock_threshold");
        var fields = new HashSet<string> { "stock" };
        if (thresholdIdx >= 0) fields.Add("lowStockThreshold");

        for (int i = 1; i < lines.Length; i++)
        {
            var rowNum = i + 1;
            var cols = CsvLineParser.Split(lines[i], delimiter);
            if (CsvLineParser.IsBlankRow(cols)) continue;
            string name = Col(cols, nameIdx).Trim();
            string stockRaw = Col(cols, stockIdx).Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                result.Errors.Add(new BulkImportRowErrorVM { Row = rowNum, Error = "Missing name" });
                continue;
            }
            if (!decimal.TryParse(stockRaw, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
            {
                result.Errors.Add(new BulkImportRowErrorVM { Row = rowNum, Error = $"Invalid stock '{stockRaw}'" });
                continue;
            }

            decimal threshold = 0;
            if (thresholdIdx >= 0)
            {
                var thresholdRaw = Col(cols, thresholdIdx).Trim();
                if (thresholdRaw.Length > 0 && (!decimal.TryParse(thresholdRaw, NumberStyles.Number, CultureInfo.InvariantCulture, out threshold) || threshold < 0))
                {
                    result.Errors.Add(new BulkImportRowErrorVM { Row = rowNum, Error = $"Invalid low_stock_threshold '{thresholdRaw}'" });
                    continue;
                }
            }

            var existing = await _productRepository.GetByNameAsync(name);
            if (existing is null)
            {
                result.Errors.Add(new BulkImportRowErrorVM { Row = rowNum, Error = $"Product '{name}' not found (stock import never creates products)" });
                continue;
            }

            var newStock = mode == StockImportModes.Add ? existing.Stock + value : value;
            if (newStock < 0)
            {
                result.Errors.Add(new BulkImportRowErrorVM { Row = rowNum, Error = $"Stock for '{name}' cannot be negative (would become {newStock})" });
                continue;
            }

            await _productRepository.UpdateAsync(existing.Id, new Product { Stock = newStock, LowStockThreshold = threshold }, fields);
            result.Updated++;
        }

        result.Total = result.Updated;
        return new ResponseModel<BulkImportResultVM> { Error = false, StatusCode = 200, Data = result };
    }

    private static string Col(List<string> cols, int idx) => idx >= 0 && idx < cols.Count ? cols[idx] : "";
}
