using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VijayDairy.Application.Managements.ProductManagement.Commands.AddProduct;
using VijayDairy.Application.Managements.ProductManagement.Commands.BulkImportProducts;
using VijayDairy.Application.Managements.ProductManagement.Commands.ImportStock;
using VijayDairy.Application.Managements.ProductManagement.Commands.DeleteProduct;
using VijayDairy.Application.Managements.ProductManagement.Commands.UpdateProduct;
using VijayDairy.Application.Managements.ProductManagement.Queries.GetAllProducts;
using VijayDairy.Common.Exceptions;

namespace VijayDairy.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProductController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        return Ok(await _mediator.Send(new GetAllProductsQuery()));
    }

    [HttpPost]
    public async Task<ActionResult> Add([FromBody] AddProductCommand command)
    {
        return Ok(await _mediator.Send(command));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UpdateProductCommand command)
    {
        command.Id = id;
        return Ok(await _mediator.Send(command));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        return Ok(await _mediator.Send(new DeleteProductCommand { Id = id }));
    }


    /// <summary>Stock-only CSV import (name,stock[,low_stock_threshold]). mode=ADD (default) adds to the present stock, mode=SET replaces it. Never creates products.</summary>
    [HttpPost("stock-import")]
    public async Task<ActionResult> StockImport(IFormFile file, [FromQuery] string? mode)
    {
        if (file is null || file.Length == 0)
            throw new ValidationException("No file uploaded", "No file uploaded");
        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            throw new ValidationException("Only .csv files are accepted", "Only .csv files are accepted");

        using var stream = file.OpenReadStream();
        return Ok(await _mediator.Send(new ImportStockCommand { FileStream = stream, Mode = mode }));
    }

    [HttpPost("bulk-import")]
    public async Task<ActionResult> BulkImport(IFormFile file)
    {
        if (file is null || file.Length == 0)
            throw new ValidationException("No file uploaded", "No file uploaded");
        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            throw new ValidationException("Only .csv files are accepted", "Only .csv files are accepted");

        using var stream = file.OpenReadStream();
        return Ok(await _mediator.Send(new BulkImportProductsCommand { FileStream = stream }));
    }
}
