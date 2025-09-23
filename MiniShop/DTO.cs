namespace MiniShop
{
    public class DTO
    {
        public class LoginRequestDto
        {
            public string Login { get; set; }
            public string Password { get; set; }
        }

        public class RegisterRequestDto
        {
            public string Login { get; set; }
            public string Password { get; set; }
        }
        public class ProductCreateDto
        {
            public string Name { get; set; }
            public decimal Price { get; set; }
            public int Stock { get; set; }
            public string Imageurl { get; set; }
        }
        public class ProductDto
        {
            public int id { get; set; }
            public string Name { get; set; }
            public decimal Price { get; set; }
            public int Stock { get; set; }
            public string Imageurl { get; set; }
        }

        public class CreateOrderDto
        {
            public List<OrderItemDto> Items { get; set; }
        }

        public class OrderItemDto
        {
            public int ProductId { get; set; }
            public int Quantity { get; set; }
        }
    }
}
