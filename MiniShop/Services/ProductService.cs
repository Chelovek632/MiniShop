using Microsoft.EntityFrameworkCore;
using MiniShop;
using MiniShop.Interface;
using MiniShop.Models;

namespace MiniShop.Services
{
    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;

        public ProductService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Product>> GetAll()
        {
            return await _context.Products.ToListAsync();
        }

        public async Task<Product?> GetById(int id)
        {
            return await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Product> Create(string name, decimal price, int stock, string imageurl)
        {
            var product = new Product
            {
                Name = name,
                Price = price,
                Stock = stock,
                imageUrl = imageurl
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return product;
        }

        // Обновляем только те поля, которые пришли (не null)
        public async Task<bool> Update(int id, string? name, decimal? price, int? stock, string? imageurl)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return false;

            if (name != null)
                product.Name = name;

            if (price != null)
                product.Price = price.Value;

            if (stock != null)
                product.Stock = stock.Value;

            if (imageurl != null)
                product.imageUrl = imageurl;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> Delete(int id)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
                return false;

            bool isReferenced = await _context.OrderItems.AnyAsync(oi => oi.ProductId == id)|| await _context.CartItems.AnyAsync(ci => ci.ProductId == id);

            if (isReferenced)
                throw new AppException("Нельзя удалить товар — он используется в заказах или корзинах");

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}