using Microsoft.EntityFrameworkCore;
using MiniShop;
using MiniShop.Interface;
using MiniShop.Models;
using MiniShop.Models.Enums;
using static MiniShop.DTO;

namespace MiniShop.Services
{
    // Сервис, где хранится логика работы с заказами
    public class OrderService : IOrderService
    {
        private readonly AppDbContext _context;

        // Получаем DbContext через конструктор
        public OrderService(AppDbContext context)
        {
            _context = context;
        }

        // Создание заказа пользователем
        public async Task<Order> CreateOrder(int userId, List<OrderItemDto> items, string address)
        {
            // Создаём новый заказ с начальными значениями
            var order = new Order
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                Status = OrderStatus.Pending,
                Address = address,
                Items = new List<OrderItem>()
            };

            // Тута по каждому товару из запроса проходимся
            foreach (var i in items)
            {
                // Ищем товар в базе по id
                var product = await _context.Products.FindAsync(i.ProductId);

                // Если товара нет в базе
                if (product == null)
                    throw new Exception($"Товар с ID {i.ProductId} не найден");

                // Если на складе товара меньше чем заказали
                if (product.Stock < i.Quantity)
                    throw new Exception($"Недостаточно товара: {product.Name}");

                // Уменьшаем количество товара на складе
                product.Stock -= i.Quantity;

                // Помечаем товар как изменённый
                _context.Entry(product).State = EntityState.Modified;

                // Добавляем позицию в заказ
                order.Items.Add(new OrderItem
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                });
            }

            // Добавляем заказ в контекст
            _context.Orders.Add(order);

            // Сохраняем заказ, айтемы и изменения склада
            await _context.SaveChangesAsync();

            return order;
        }

        // Получение конкретного заказа пользователя
        public async Task<Order?> GetById(int id, int userId)
        {
            return await _context.Orders
                // Берём только заказы текущего пользователя
                .Where(o => o.UserId == userId)
                // Подгружаем позиции заказа
                .Include(o => o.Items)
                // Подгружаем товары внутри позиций
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        // Получение всех заказов конкретного пользователя
        public async Task<List<Order>> GetUserOrders(int userId)
        {
            return await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
                .ToListAsync();
        }

        // Изменение статуса заказа
        public async Task UpdateStatus(int orderId, OrderStatus newStatus)
        {
            // Ищем заказ по id
            var order = await _context.Orders.FindAsync(orderId);

            if (order == null)
                throw new Exception("Заказ не найден");

            // Проверяем, разрешён ли такой переход статуса
            if (!IsValidTransition(order.Status, newStatus))
                throw new Exception("Недопустимый переход статуса");

            // Обновляем статус
            order.Status = newStatus;

            await _context.SaveChangesAsync();
        }

        // Проверка допустимых переходов статусов
        private bool IsValidTransition(OrderStatus current, OrderStatus next)
        {
            return current switch
            {
                // Из Pending можно перейти только в Paid или Canceled
                OrderStatus.Pending => next is OrderStatus.Paid or OrderStatus.Canceled,

                // Из Paid можно перейти только в Shipped
                OrderStatus.Paid => next is OrderStatus.Shipped,

                // Из Shipped можно перейти только в Delivered
                OrderStatus.Shipped => next is OrderStatus.Delivered,

                // Все остальные переходы запрещены
                _ => false
            };
        }

        // Получение всех заказов для админки через DTO
        public async Task<List<AdminOrderDto>> GetAllOrdersForAdmin()
        {
            return await _context.Orders
                // Сортируем по дате создания
                .OrderByDescending(o => o.CreatedAt)
                // Сразу в DTO
                .Select(o => new AdminOrderDto
                {
                    Id = o.Id,
                    Status = o.Status,
                    CreatedAt = o.CreatedAt,
                    UserLogin = o.User.Login,

                    // Формируем список товаров заказа
                    Items = o.Items.Select(i => new AdminOrderItemDto
                    {
                        ProductName = i.Product.Name,
                        Price = i.Product.Price,
                        Quantity = i.Quantity
                    }).ToList()
                })
                .ToListAsync();
        }
    }
}
