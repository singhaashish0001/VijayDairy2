using FluentValidation;
using VijayDairy.Application.Helpers;

namespace VijayDairy.Application.Managements.InvoiceManagement.Commands.AddInvoice;

public class AddInvoiceValidator : AbstractValidator<AddInvoiceCommand>
{
    public AddInvoiceValidator()
    {
        RuleFor(x => x.Items).NotNull().Must(items => items.Count > 0)
            .WithMessage("Invoice must contain at least one item");

        RuleForEach(x => x.Items).Custom((item, context) =>
        {
            if ((item.Discount ?? 0) < 0)
            {
                context.AddFailure("Discount cannot be negative.");
                return;
            }
            var result = InvoiceLineCalculator.Calculate(item.Unit, item.Price, item.SellingMode, InvoiceLineCalculator.EnteredValue(item));
            if (!result.Ok) context.AddFailure($"{item.Name}: {result.Error}");
        });
    }
}
