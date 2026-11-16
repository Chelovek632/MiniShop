using System.ComponentModel.DataAnnotations;
using MiniShop.Models.Enums;

namespace MiniShop
{
    public class DTO
    {
        public class LoginRequestDto
        {
            [Required(ErrorMessage = "Введите логин")]
            public string Login { get; set; } = string.Empty;

            [Required(ErrorMessage = "Введите пароль")]
            public string Password { get; set; } = string.Empty;
        }

        public class RegisterRequestDto
        {
            [Required(ErrorMessage = "Введите логин")]
            [StringLength(50, MinimumLength = 3, ErrorMessage = "Логин должен быть от 3 до 50 символов")]
            public string Login { get; set; } = string.Empty;

            [Required(ErrorMessage = "Введите пароль")]
            [StringLength(100, MinimumLength = 6, ErrorMessage = "Пароль должен быть не короче 6 символов")]
            public string Password { get; set; } = string.Empty;
        }

        public class ProductCreateDto
        {
            [Required(ErrorMessage = "Введите название")]
            [StringLength(200, ErrorMessage = "Название — не более 200 символов")]
            public string Name { get; set; } = string.Empty;

            [Range(0.01, 1000000, ErrorMessage = "Цена должна быть больше 0")]
            public decimal Price { get; set; }

            [Range(0, 1000000, ErrorMessage = "Количество не может быть отрицательным")]
            public int Stock { get; set; }

            [StringLength(500, ErrorMessage = "URL изображения — не более 500 символов")]
            public string? Imageurl { get; set; }
        }

        // Отдельный DTO для обновления — все поля nullable
        // Если поле не передано (null) — оно не перезаписывается
        public class ProductUpdateDto
        {
            [StringLength(200, ErrorMessage = "Название — не более 200 символов")]
            public string? Name { get; set; }

            [Range(0.01, 1000000, ErrorMessage = "Цена должна быть больше 0")]
            public decimal? Price { get; set; }

            [Range(0, 1000000, ErrorMessage = "Количество не может быть отрицательным")]
            public int? Stock { get; set; }

            [StringLength(500, ErrorMessage = "URL изображения — не более 500 символов")]
            public string? Imageurl { get; set; }
        }

        public class ProductDto
        {
            public int id { get; set; }
            public string Name { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public int Stock { get; set; }
            public string Imageurl { get; set; } = string.Empty;
        }

        public class CreateOrderDto
        {
            [Required(ErrorMessage = "Введите адрес доставки")]
            [StringLength(500, MinimumLength = 10, ErrorMessage = "Адрес — от 10 до 500 символов")]
            public string Address { get; set; } = string.Empty;

            [Required(ErrorMessage = "Корзина пуста")]
            [MinLength(1, ErrorMessage = "Корзина пуста")]
            public List<OrderItemDto> Items { get; set; } = new();
        }

        public class OrderItemDto
        {
            [Range(1, int.MaxValue, ErrorMessage = "Некорректный товар")]
            public int ProductId { get; set; }

            [Range(1, 10000, ErrorMessage = "Количество — от 1 до 10000")]
            public int Quantity { get; set; }
        }

        public class CreateCartDto
        {
            [Required(ErrorMessage = "Пустая корзина")]
            [MinLength(1, ErrorMessage = "Пустая корзина")]
            public List<CartItemDto> Items { get; set; } = new();
        }

        public class CartItemDto
        {
            [Range(1, int.MaxValue, ErrorMessage = "Некорректный товар")]
            public int ProductId { get; set; }

            [Range(1, 10000, ErrorMessage = "Количество — от 1 до 10000")]
            public int Quantity { get; set; }
        }

        public class UpdateOrderStatusDto
        {
            [Required(ErrorMessage = "Укажите статус")]
            public OrderStatus Status { get; set; }
        }

        public class ChangePasswordDto
        {
            [Required(ErrorMessage = "Введите текущий пароль")]
            public string OldPassword { get; set; } = string.Empty;

            [Required(ErrorMessage = "Введите новый пароль")]
            [StringLength(100, MinimumLength = 6, ErrorMessage = "Новый пароль — не короче 6 символов")]
            public string NewPassword { get; set; } = string.Empty;
        }

        public class AdminOrderDto
        {
            public int Id { get; set; }
            public string UserLogin { get; set; } = string.Empty;
            public OrderStatus Status { get; set; }
            public DateTime CreatedAt { get; set; }
            public List<AdminOrderItemDto> Items { get; set; } = new();
        }

        public class AdminOrderItemDto
        {
            public string ProductName { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public int Quantity { get; set; }
        }
    }
}
