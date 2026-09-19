using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using VijayDairy.Application.Helpers;
using VijayDairy.Application.Interfaces;
using VijayDairy.Persistence;
using VijayDairy.Postgres;

namespace VijayDairy.Application.Extensions;

/// <summary>Registers all repository and application-level services in the DI container.</summary>
public static class ServiceCollectionExtension
{
    public static IServiceCollection AddInternalServices(this IServiceCollection services, string connectionString)
    {
        services.AddScoped<IUserRepository>(_ => new UserRepository(connectionString));
        services.AddScoped<IProductRepository>(_ => new ProductRepository(connectionString));
        services.AddScoped<IInvoiceRepository>(_ => new InvoiceRepository(connectionString));
        services.AddScoped<ISettingsRepository>(_ => new SettingsRepository(connectionString));

        services.AddSingleton<ITokenService, TokenService>();

        RegisterValidators(services);

        return services;
    }

    /// <summary>
    /// Registers FluentValidation validators manually rather than via auto-validation,
    /// since validation already runs once through the MediatR RequestValidationBehavior
    /// pipeline — auto-validation would run it twice.
    /// </summary>
    private static void RegisterValidators(IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();
        AssemblyScanner.FindValidatorsInAssembly(assembly).ForEach(pair =>
        {
            services.AddTransient(pair.InterfaceType, pair.ValidatorType);
        });
    }
}
