using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using VijayDairy.Common.Enums;
using VijayDairy.Common.Exceptions;
using VijayDairy.Common.Utility;
using VijayDairy.Domain.Models.Common;

namespace VijayDairy.Api.Middlewares;

/// <summary>Maps every exception thrown further down the pipeline to a ResponseModel + status code.</summary>
public class ErrorHandling
{
    private readonly RequestDelegate _next;

    public ErrorHandling(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext httpContext, ILogger<ErrorHandling> logger)
    {
        try
        {
            await _next(httpContext);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(httpContext, ex, logger);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception ex, ILogger logger)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        var errorMessage = ErrorMessages.SomethingWentWrong.ToString();
        var errorMessageText = ErrorMessages.SomethingWentWrong.GetEnumDescription();

        switch (ex)
        {
            case InternalServerException e:
                statusCode = HttpStatusCode.InternalServerError;
                errorMessage = e.Message; errorMessageText = e.MessageText;
                break;
            case NotFoundException e:
                statusCode = HttpStatusCode.NotFound;
                errorMessage = e.Message; errorMessageText = e.MessageText;
                break;
            case ValidationException e:
                statusCode = HttpStatusCode.BadRequest;
                errorMessage = e.Message; errorMessageText = e.MessageText;
                break;
            case DuplicateResourceException e:
                statusCode = HttpStatusCode.Conflict;
                errorMessage = e.Message; errorMessageText = e.MessageText;
                break;
            case InvalidEmailOrPasswordException e:
                statusCode = HttpStatusCode.Unauthorized;
                errorMessage = e.Message; errorMessageText = e.MessageText;
                break;
            case UnauthorizedException e:
                statusCode = HttpStatusCode.Unauthorized;
                errorMessage = e.Message; errorMessageText = e.MessageText;
                break;
        }

        var result = JsonConvert.SerializeObject(
            new ResponseModel
            {
                Error = true,
                StatusCode = (int)statusCode,
                MessageId = errorMessage,
                MessageText = errorMessageText,
            },
            new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() });

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);

        return context.Response.WriteAsync(result);
    }
}
