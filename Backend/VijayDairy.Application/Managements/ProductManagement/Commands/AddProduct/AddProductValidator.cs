using FluentValidation;
using VijayDairy.Domain.Entities;

namespace VijayDairy.Application.Managements.ProductManagement.Commands.AddProduct;

public class AddProductValidator : AbstractValidator<AddProductCommand>
{
    public AddProductValidator()
    {
        RuleFor(x => x.Name).NotNull().NotEmpty().MaximumLength(200);
        RuleFor(x => x.Unit).Must(u => ProductUnits.IsValid(u)).WithMessage("Invalid unit. Allowed: LTR, KG, PCS");
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
    }
}
