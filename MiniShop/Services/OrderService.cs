using Microsoft.EntityFrameworkCore;
using MiniShop;
using MiniShop.Interface;
using MiniShop.Models;
using static MiniShop.DTO;

namespace MiniShop.Services
{
    public class OrderService : IOrderService
    {
        private readonly AppDbContext _context;

        public OrderService(AppDbContext context)
        {
            _context = context;

        }

        public async Task<Order> CreateOrder(int userId, List<OrderItemDto> items, string address)
        {
            // 1. Создание объектов заказа и элементов...
            var order = new Order
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                Status = "В обработке",
                Address = address,
                Items = new List<OrderItem>()
            };

            foreach (var i in items)
            {
                // Загрузка товара. FindAsync отслеживает его.
                var product = await _context.Products.FindAsync(i.ProductId);

                if (product == null)
                    throw new Exception($"Товар с ID {i.ProductId} не найден");

                if (product.Stock < i.Quantity)
                    throw new Exception($"Недостаточно товара: {product.Name}");

                // 2. Уменьшение остатка
                product.Stock -= i.Quantity;

                // 💡 КРИТИЧЕСКИЙ ШАГ: ЯВНО УКАЗЫВАЕМ, ЧТО СУЩНОСТЬ ИЗМЕНЕНА
                // Это гарантирует, что EF Core сгенерирует SQL UPDATE.
                _context.Entry(product).State = Microsoft.EntityFrameworkCore.EntityState.Modified;

                // 3. Добавление элемента заказа
                order.Items.Add(new OrderItem
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                });
            }

            // 4. Добавление заказа
            _context.Orders.Add(order);

            // 5. Сохранение всех изменений (Order, OrderItems и Product.Stock)
            await _context.SaveChangesAsync();

            return order;
        }

        public async Task<Order?> GetById(int id, int userId)
        {
            return await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<List<Order>> GetUserOrders(int userId)
        {
            return await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
                .ToListAsync();
        }
    }
}