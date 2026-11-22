using EducationalPlatform.Morabbi.Application.Constants;
using Microsoft.AspNetCore.Diagnostics;

namespace EducationalPlatform.Morabbi.API.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var (status, payload) = ex switch
        {
            KeyNotFoundException => (StatusCodes.Status404NotFound, GenericErrorMessages.NotFound),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, GenericErrorMessages.Unauthorized),
            _ => (StatusCodes.Status500InternalServerError, GenericErrorMessages.InternalError)
        };

        if (context.Response.HasStarted) return;
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsync(
            System.Text.Json.JsonSerializer.Serialize(payload, new System.Text.Json.JsonSerializerOptions
            {
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            }));
    }
}
