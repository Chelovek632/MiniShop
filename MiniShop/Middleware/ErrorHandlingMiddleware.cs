using System.Text.Json;

namespace MiniShop.Middleware
{
    // Последний рубеж: любое необработанное исключение → JSON {error} вместо HTML-страницы 500
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
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
            catch (AppException ex)
            {
                // Бизнес-ошибка — отдаём её сообщение и статус
                await WriteErrorAsync(context, ex.StatusCode, ex.Message);
            }
            catch (Exception ex)
            {
                // Неожиданная ошибка — логируем, наружу отдаём только общее сообщение
                _logger.LogError(ex, "Unhandled exception for {Method} {Path}",
                    context.Request.Method, context.Request.Path);
                await WriteErrorAsync(context, 500, "Внутренняя ошибка сервера");
            }
        }

        private static async Task WriteErrorAsync(HttpContext context, int statusCode, string message)
        {
            if (context.Response.HasStarted) return;

            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { error = message }));
        }
    }
}
