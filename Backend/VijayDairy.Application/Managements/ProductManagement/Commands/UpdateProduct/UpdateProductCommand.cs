using System;
using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Product;

namespace VijayDairy.Application.Managements.ProductManagement.Commands.UpdateProduct;

public class UpdateProductCommand : IRequest<ResponseModel<ProductVM>>
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Unit { get; set; }
    public decimal? Price { get; set; }
    public decimal? Stock { get; set; }
    public decimal? LowStockThreshold { get; set; }
}
