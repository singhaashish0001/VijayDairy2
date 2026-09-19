using System.IO;
using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Product;

namespace VijayDairy.Application.Managements.ProductManagement.Commands.BulkImportProducts;

public class BulkImportProductsCommand : IRequest<ResponseModel<BulkImportResultVM>>
{
    public Stream FileStream { get; set; } = Stream.Null;
}
