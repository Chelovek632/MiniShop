using Microsoft.EntityFrameworkCore;
using MiniShop;
using MiniShop.Interface;
using MiniShop.Models;
using static MiniShop.DTO;

namespace MiniShop.Services
{
    // Сервис корзины
    // Тут всё, что связано с тем, что пользователь накидал перед заказом
    public class CartService : ICartService
    {
        private readonly AppDbContext _context;

        // Подключаем контекст базы
        public CartService(AppDbContext context)
        {
            _context = context;
        }

        // Создание корзины
        // На вход приходит список товаров, которые пользователь выбрал
        public async Task<Cart> CreateCart(int userId, List<CartItemDto> items)
        {
            // Сначала пробегаемся по всем товарам
            // Проверяем, что они вообще существуют и их хватает
            foreach (var i in items)
            {
                var product = await _context.Products.FindAsync(i.ProductId);

                if (product == null)
                    throw new Exception($"Товар с ID {i.ProductId} не найден");

                if (product.Stock < i.Quantity)
                    throw new Exception($"Недостаточно товара: {product.Name}");
            }

            // Если всё ок, собираем корзину
            var Cart = new Cart
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,

                // Тут по каждому товару из DTO создаём CartItem
                Items = items.Select(i => new CartItem
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity
                }).ToList()
            };

            // Добавляем корзину в базу
            await _context.Carts.AddAsync(Cart);

            // Сохраняем, чтобы корзина реально появилась
            await _context.SaveChangesAsync();

            return Cart;
        }

        // Получение всех корзин пользователя
        public async Task<List<Cart>> GetUserCarts(int userId)
        {
            return await _context.Carts
                .Where(o => o.UserId == userId)

                // Подгружаем элементы корзины
                .Include(o => o.Items)

                // И сразу продукты, чтобы фронт не страдал
                .ThenInclude(oi => oi.Product)
                .ToListAsync();
        }

        // Очистка всех корзин пользователя
        // Используется после оформления заказа
        public async Task DeleteCarts(int userId)
        {
            // Забираем все корзины пользователя
            var userCarts = await _context.Carts
                .Where(c => c.UserId == userId)
                .Include(c => c.Items)
                .ToListAsync();

            // Если корзины вообще есть
            if (userCarts.Any())
            {
                // Сначала удаляем все CartItems
                // Иначе база начнёт ругаться
                foreach (var cart in userCarts)
                {
                    _context.CartItems.RemoveRange(cart.Items);
                }

                // Потом удаляем сами корзины
                _context.Carts.RemoveRange(userCarts);

                // Фиксируем, что пользователь теперь с пустыми руками
                await _context.SaveChangesAsync();
            }
        }

        // Этот метод пока не нужен, но пусть полежит
        // Возможно пригодится позже
        //public async Task<Cart?> GetById(int id, int userId)
        //{
        //    return await _context.Carts
        //        .Where(o => o.UserId == userId)
        //        .Include(o => o.Items)
        //        .ThenInclude(oi => oi.Product)
        //        .FirstOrDefaultAsync(o => o.Id == id);
        //}
    }
}
