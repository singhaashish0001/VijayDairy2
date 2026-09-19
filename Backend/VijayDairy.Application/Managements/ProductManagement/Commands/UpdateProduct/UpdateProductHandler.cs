using System.Collections.Generic;
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

namespace VijayDairy.Application.Managements.ProductManagement.Commands.UpdateProduct;

public class UpdateProductHandler : IRequestHandler<UpdateProductCommand, ResponseModel<ProductVM>>
{
    private readonly IProductRepository _productRepository;

    public UpdateProductHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<ResponseModel<ProductVM>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var fields = new HashSet<string>();
        var patch = new Product();

        if (request.Name is not null) { fields.Add("name"); patch.Name = request.Name.Trim(); }
        if (request.Unit is not null) { fields.Add("unit"); patch.Unit = request.Unit.Trim().ToUpperInvariant(); }
        if (request.Price is not null) { fields.Add("price"); patch.Price = request.Price.Value; }
        if (request.Stock is not null) { fields.Add("stock"); patch.Stock = request.Stock.Value; }
        if (request.LowStockThreshold is not null) { fields.Add("lowStockThreshold"); patch.LowStockThreshold = request.LowStockThreshold.Value; }

        Product? updated;
        try
        {
            updated = await _productRepository.UpdateAsync(request.Id, patch, fields);
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
        {
            throw new DuplicateResourceException(ErrorMessages.NameNotAvailable.ToString(), ErrorMessages.NameNotAvailable.GetEnumDescription());
        }

        if (updated is null)
            throw new NotFoundException(ErrorMessages.RecordNotFound.ToString(), ErrorMessages.RecordNotFound.GetEnumDescription());

        return new ResponseModel<ProductVM>
        {
            Error = false,
            StatusCode = 200,
            Data = new ProductVM
            {
                Id = updated.Id,
                Name = updated.Name,
                Unit = updated.Unit,
                Price = updated.Price,
                Stock = updated.Stock,
                LowStockThreshold = updated.LowStockThreshold,
                CreatedAt = updated.CreatedAt,
            },
        };
    }
}
