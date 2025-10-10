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
            var Cart = new Cart
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                Items = items.Select(i => new CartItem
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity
                }).ToList()
            };


            await _context.Carts.AddAsync(Cart);
            await _context.SaveChangesAsync();
            return Cart;
        }



        public async Task<List<Cart>> GetUserCarts(int userId)
        {
            return await _context.Carts
                .Where(o => o.UserId == userId)
                .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
                .ToListAsync();
        }

        public async Task DeleteCarts(int userId)
        {
            var userCarts = await _context.Carts
                .Where(c => c.UserId == userId)
                .Include(c => c.Items)
                .ToListAsync();
            if (userCarts.Any())
            {
                foreach (var cart in userCarts)
                {
                    _context.CartItems.RemoveRange(cart.Items);
                }
                _context.Carts.RemoveRange(userCarts);
                await _context.SaveChangesAsync();
            }
        }
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