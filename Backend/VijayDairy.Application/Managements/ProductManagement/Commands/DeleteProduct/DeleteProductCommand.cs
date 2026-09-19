using System;
using MediatR;
using VijayDairy.Domain.Models.Common;

namespace VijayDairy.Application.Managements.ProductManagement.Commands.DeleteProduct;

public class DeleteProductCommand : IRequest<ResponseModel>
{
    public Guid Id { get; set; }
}
