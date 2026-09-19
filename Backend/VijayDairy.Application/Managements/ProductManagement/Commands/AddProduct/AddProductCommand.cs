using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Product;

namespace VijayDairy.Application.Managements.ProductManagement.Commands.AddProduct;

public class AddProductCommand : IRequest<ResponseModel<ProductVM>>
{
    public string Name { get; set; } = "";
    public string Unit { get; set; } = "";
    public decimal Price { get; set; }
    public decimal? Stock { get; set; }
    public decimal? LowStockThreshold { get; set; }
}
