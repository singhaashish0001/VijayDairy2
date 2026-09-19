using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using ValidationException = VijayDairy.Common.Exceptions.ValidationException;

namespace VijayDairy.Application.Behaviours;

/// <summary>
/// MediatR pipeline behaviour that runs every registered FluentValidation validator
/// for the incoming request before the handler executes. Validators are registered
/// manually (not via auto-validation) — see ServiceCollectionExtension.RegisterValidators.
/// </summary>
public class RequestValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly System.Collections.Generic.IEnumerable<IValidator<TRequest>> _validators;

    public RequestValidationBehavior(System.Collections.Generic.IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);
            var failures = _validators
                .Select(v => v.Validate(context))
                .SelectMany(result => result.Errors)
                .Where(failure => failure != null)
                .ToList();

            if (failures.Count > 0)
            {
                var message = string.Join(" ", failures.Select(f => f.ErrorMessage));
                throw new ValidationException(message, message);
            }
        }

        return await next();
    }
}
