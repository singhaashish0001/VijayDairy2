using System.Collections.Generic;
using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Product;

namespace VijayDairy.Application.Managements.ProductManagement.Queries.GetAllProducts;

public class GetAllProductsQuery : IRequest<ResponseModel<List<ProductVM>>>
{
}
