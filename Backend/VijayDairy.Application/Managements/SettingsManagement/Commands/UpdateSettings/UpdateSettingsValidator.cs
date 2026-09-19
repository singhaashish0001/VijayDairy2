using FluentValidation;

namespace VijayDairy.Application.Managements.SettingsManagement.Commands.UpdateSettings;

public class UpdateSettingsValidator : AbstractValidator<UpdateSettingsCommand>
{
    public UpdateSettingsValidator()
    {
        RuleFor(x => x.ShopName).NotNull().NotEmpty();
    }
}
