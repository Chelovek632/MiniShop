namespace MiniShop
{
    // Бизнес-исключение: контроллеры ловят его и возвращают {error},
    // а всё непредвиденное уходит в ErrorHandlingMiddleware → чистый 500
    public class AppException : Exception
    {
        public int StatusCode { get; }

        public AppException(string message) : this(400, message)
        {
        }

        public AppException(int statusCode, string message) : base(message)
        {
            StatusCode = statusCode;
        }
    }
}
