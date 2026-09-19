using FluentValidation;
using VijayDairy.Domain.Entities;

namespace VijayDairy.Application.Managements.ProductManagement.Commands.UpdateProduct;

public class UpdateProductValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductValidator()
    {
        RuleFor(x => x)
            .Must(x => x.Name is not null || x.Unit is not null || x.Price is not null || x.Stock is not null || x.LowStockThreshold is not null)
            .WithMessage("No fields to update");

        RuleFor(x => x.Unit).Must(u => ProductUnits.IsValid(u)).When(x => x.Unit is not null)
            .WithMessage("Invalid unit. Allowed: LTR, KG, PCS");

        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).When(x => x.Price is not null);
    }
}
