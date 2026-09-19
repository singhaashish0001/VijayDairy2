using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Product;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.ProductManagement.Queries.GetAllProducts;

public class GetAllProductsHandler : IRequestHandler<GetAllProductsQuery, ResponseModel<List<ProductVM>>>
{
    private readonly IProductRepository _productRepository;

    public GetAllProductsHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<ResponseModel<List<ProductVM>>> Handle(GetAllProductsQuery request, CancellationToken cancellationToken)
    {
        var products = await _productRepository.GetAllAsync();
        var data = products.Select(p => new ProductVM
        {
            Id = p.Id,
            Name = p.Name,
            Unit = p.Unit,
            Price = p.Price,
            Stock = p.Stock,
            LowStockThreshold = p.LowStockThreshold,
            CreatedAt = p.CreatedAt,
        }).ToList();

        return new ResponseModel<List<ProductVM>> { Error = false, StatusCode = 200, Data = data };
    }
}
