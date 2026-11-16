using Microsoft.EntityFrameworkCore;
using MiniShop;
using MiniShop.Interface;
using MiniShop.Models;
using static MiniShop.DTO;

namespace MiniShop.Services
{
    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;

        public ProductService(AppDbContext context)
        {
            _context = context;
        }

        // Каталог: поиск по названию, фильтр по категории, пагинация
        public async Task<PagedProductsDto> Search(string? search, int? categoryId, int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 12;
            if (pageSize > 100) pageSize = 100;

            var query = _context.Products
                .Include(p => p.Category)
                .AsQueryable();

            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryId == categoryId.Value);

            // Каталог небольшой: после SQL-фильтра по категории ищем в памяти —
            // регистронезависимо для кириллицы (SQL lower() зависит от провайдера:
            // в SQLite он складывает только ASCII)
            var all = await query.ToListAsync();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                all = all
                    .Where(p => p.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            var total = all.Count;
            var items = all
                .OrderBy(p => p.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedProductsDto
            {
                items = items.Select(ToDto).ToList(),
                total = total,
                page = page,
                pageSize = pageSize
            };
        }

        public async Task<Product?> GetById(int id)
        {
            return await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Product> Create(string name, decimal price, int stock, string imageurl, int? categoryId)
        {
            await EnsureCategoryExists(categoryId);

            var product = new Product
            {
                Name = name,
                Price = price,
                Stock = stock,
                imageUrl = imageurl,
                CategoryId = categoryId
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return product;
        }

        // Обновляем только те поля, которые пришли (не null)
        public async Task<bool> Update(int id, string? name, decimal? price, int? stock, string? imageurl, int? categoryId)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return false;

            if (categoryId.HasValue)
                await EnsureCategoryExists(categoryId);

            if (name != null)
                product.Name = name;

            if (price != null)
                product.Price = price.Value;

            if (stock != null)
                product.Stock = stock.Value;

            if (imageurl != null)
                product.imageUrl = imageurl;

            if (categoryId != null)
                product.CategoryId = categoryId.Value;

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

        private async Task EnsureCategoryExists(int? categoryId)
        {
            if (categoryId.HasValue &&
                !await _context.Categories.AnyAsync(c => c.Id == categoryId.Value))
                throw new AppException($"Категория с ID {categoryId} не найдена");
        }

        private static ProductDto ToDto(Product p) => new()
        {
            id = p.Id,
            Name = p.Name,
            Price = p.Price,
            Stock = p.Stock,
            Imageurl = p.imageUrl,
            CategoryId = p.CategoryId,
            CategoryName = p.Category?.Name
        };
    }
}
