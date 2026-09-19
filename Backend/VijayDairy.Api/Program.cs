using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.DependencyInjection;
using VijayDairy.Api.Helpers;
using VijayDairy.Application.Helpers;
using VijayDairy.Application.Interfaces;
using VijayDairy.Domain.Entities;
using VijayDairy.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

// Global authentication for all APIs — controllers/actions opt out via [AllowAnonymous].
builder.Services.AddControllers(options =>
{
    var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
    options.Filters.Add(new AuthorizeFilter(policy));
}).AddNewtonsoftJson();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        policy.WithOrigins("http://localhost:5173", "http://localhost:5175").AllowAnyHeader().AllowAnyMethod();
    });
});

ServiceManager.RegisterDocumentService(builder.Services);
ServiceManager.RegisterCustomService(builder.Services, builder.Configuration);
ServiceManager.RegisterFluentValidationService(builder.Services);
ServiceManager.RegisterAuthenticationService(builder.Services, builder.Configuration);
ServiceManager.RegisterNotificationService(builder.Services);

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors("Frontend");

ServiceManager.RegisterCustomMiddleware(app);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Seed the admin user on startup if none exists — mirrors ADMIN_EMAIL/ADMIN_PASSWORD env-based seeding.
using (var scope = app.Services.CreateScope())
{
    var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
    var adminEmail = app.Configuration["Admin:Email"] ?? "admin@vijaydairy.com";
    var adminPassword = app.Configuration["Admin:Password"] ?? "Admin@123";
    var adminName = app.Configuration["Admin:Name"] ?? "Admin";

    var existing = await userRepository.GetByEmailAsync(adminEmail);
    if (existing is null)
    {
        await userRepository.CreateAsync(new User
        {
            Email = adminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            Name = adminName,
            Role = "admin",
        });
    }
}

app.Run();
