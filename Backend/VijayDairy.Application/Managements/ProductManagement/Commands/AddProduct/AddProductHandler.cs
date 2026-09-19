using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Common.Enums;
using VijayDairy.Common.Exceptions;
using VijayDairy.Common.Utility;
using VijayDairy.Domain.Entities;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Product;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.ProductManagement.Commands.AddProduct;

public class AddProductHandler : IRequestHandler<AddProductCommand, ResponseModel<ProductVM>>
{
    private readonly IProductRepository _productRepository;

    public AddProductHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<ResponseModel<ProductVM>> Handle(AddProductCommand request, CancellationToken cancellationToken)
    {
        var existing = await _productRepository.GetByNameAsync(request.Name.Trim());
        if (existing is not null)
            throw new DuplicateResourceException(ErrorMessages.NameNotAvailable.ToString(), ErrorMessages.NameNotAvailable.GetEnumDescription());

        var created = await _productRepository.CreateAsync(new Product
        {
            Name = request.Name.Trim(),
            Unit = request.Unit.Trim().ToUpperInvariant(),
            Price = request.Price,
            Stock = request.Stock ?? 0,
            LowStockThreshold = request.LowStockThreshold ?? 0,
        });

        return new ResponseModel<ProductVM>
        {
            Error = false,
            StatusCode = 201,
            Data = new ProductVM
            {
                Id = created.Id,
                Name = created.Name,
                Unit = created.Unit,
                Price = created.Price,
                Stock = created.Stock,
                LowStockThreshold = created.LowStockThreshold,
                CreatedAt = created.CreatedAt,
            },
        };
    }
}
