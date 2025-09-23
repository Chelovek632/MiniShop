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
        public async Task<bool> Update(int id, string name, decimal price, int stock)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return false;
            }
            product.Name = name;
            product.Price = price;
            product.Stock = stock;
            _context.Products.Update(product);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> Delete(int id)
        { 
             var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                return false;
            }
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return true;
        }



    }
}