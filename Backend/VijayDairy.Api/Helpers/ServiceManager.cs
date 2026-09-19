using System.Text;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using VijayDairy.Api.Middlewares;
using VijayDairy.Application;
using VijayDairy.Application.Behaviours;
using VijayDairy.Application.Extensions;
using VijayDairy.Application.Helpers;
using VijayDairy.Application.Interfaces;

namespace VijayDairy.Api.Helpers;

/// <summary>Central place for all startup service/middleware registration, mirroring the
/// monoZTrack ServiceManager pattern (kept out of Program.cs for readability).</summary>
public static class ServiceManager
{
    public static void RegisterCustomService(IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(RequestValidationBehavior<,>));

        var connectionString = configuration.GetConnectionString("Postgres")!;
        services.AddInternalServices(connectionString);
    }

    public static void RegisterDocumentService(IServiceCollection services)
    {
        services.AddSwaggerGen(s =>
        {
            s.SwaggerDoc("v1", new OpenApiInfo { Title = "Vijay Dairy", Version = "v1" });
            s.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
            });
        });
    }

    public static void RegisterNotificationService(IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(InitializeApplication).Assembly));
    }

    public static void RegisterAuthenticationService(IServiceCollection services, IConfiguration configuration)
    {
        var jwtSecret = configuration["Jwt:Secret"]!;
        var jwtIssuer = configuration["Jwt:Issuer"]!;
        var jwtAudience = configuration["Jwt:Audience"]!;

        services.AddAuthentication(x =>
        {
            x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            // Without this, ASP.NET Core's inbound claim mapping silently renames the "sub"
            // claim to the legacy http://schemas.xmlsoap.org/.../nameidentifier URI after
            // validation, so User.FindFirst(JwtRegisteredClaimNames.Sub) (used by
            // CurrentUserService.GetUserId()) never finds it — breaking any endpoint that
            // needs the caller's identity (e.g. /auth/me), while token-only endpoints still
            // pass since the middleware itself accepts the token fine.
            options.MapInboundClaims = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            };
        });
    }

    /// <summary>Registers FluentValidation validators manually — see ServiceCollectionExtension.RegisterValidators
    /// for why auto-validation is intentionally not used.</summary>
    public static void RegisterFluentValidationService(IServiceCollection services)
    {
        // Validators are registered from the Application assembly inside AddInternalServices.
    }

    public static void RegisterCustomMiddleware(IApplicationBuilder app)
    {
        app.UseMiddleware<ErrorHandling>();
    }
}
