using Microsoft.EntityFrameworkCore;
using MiniShop;
using MiniShop.Interface;
using MiniShop.Models;
using static MiniShop.DTO;

namespace MiniShop.Services
{
    public class CartService : ICartService
    {
        private readonly AppDbContext _context;

        public CartService(AppDbContext context)
        {
            _context = context;
        }

        // Добавление товаров в корзину
        // Если корзина уже есть — добавляем в неё, если нет — создаём новую
        public async Task<Cart> CreateCart(int userId, List<CartItemDto> items)
        {
            foreach (var i in items)
            {
                var product = await _context.Products.FindAsync(i.ProductId);

                if (product == null)
                    throw new Exception($"Товар с ID {i.ProductId} не найден");

                if (product.Stock < i.Quantity)
                    throw new Exception($"Недостаточно товара: {product.Name}");
            }

            var existingCart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (existingCart != null)
            {
                foreach (var i in items)
                {
                    var existingItem = existingCart.Items
                        .FirstOrDefault(ci => ci.ProductId == i.ProductId);

                    if (existingItem != null)
                        existingItem.Quantity += i.Quantity;
                    else
                        existingCart.Items.Add(new CartItem
                        {
                            ProductId = i.ProductId,
                            Quantity = i.Quantity
                        });
                }

                await _context.SaveChangesAsync();
                return existingCart;
            }

            var cart = new Cart
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                Items = items.Select(i => new CartItem
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity
                }).ToList()
            };

            await _context.Carts.AddAsync(cart);
            await _context.SaveChangesAsync();

            return cart;
        }

        // Получение корзины пользователя (одна, не список)
        public async Task<Cart?> GetUserCart(int userId)
        {
            return await _context.Carts
                .Where(c => c.UserId == userId)
                .Include(c => c.Items)
                .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync();
        }

        // Очистка корзины
        public async Task DeleteCart(int userId)
        {
            var cart = await _context.Carts
                .Where(c => c.UserId == userId)
                .Include(c => c.Items)
                .FirstOrDefaultAsync();

            if (cart != null)
            {
                _context.CartItems.RemoveRange(cart.Items);
                _context.Carts.Remove(cart);
                await _context.SaveChangesAsync();
            }
        }
    }
}