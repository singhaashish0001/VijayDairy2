using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Common.Enums;
using VijayDairy.Common.Exceptions;
using VijayDairy.Common.Utility;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.ProductManagement.Commands.DeleteProduct;

public class DeleteProductHandler : IRequestHandler<DeleteProductCommand, ResponseModel>
{
    private readonly IProductRepository _productRepository;

    public DeleteProductHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<ResponseModel> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var deleted = await _productRepository.DeleteAsync(request.Id);
        if (!deleted)
            throw new NotFoundException(ErrorMessages.RecordNotFound.ToString(), ErrorMessages.RecordNotFound.GetEnumDescription());

        return new ResponseModel
        {
            Error = false,
            StatusCode = 200,
            MessageId = SuccessMessages.DeleteSuccess.ToString(),
            MessageText = SuccessMessages.DeleteSuccess.GetEnumDescription(),
        };
    }
}
