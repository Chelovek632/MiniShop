using Microsoft.EntityFrameworkCore;
using MiniShop;
using MiniShop.Interface;
using MiniShop.Models;

namespace MiniShop.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly AppDbContext _context;

        public CategoryService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Category>> GetAll()
        {
            return await _context.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<Category> Create(string name)
        {
            name = name.Trim();

            if (string.IsNullOrWhiteSpace(name))
                throw new AppException("Введите название категории");

            // Сравниваем в памяти: SQL lower() не переживает кириллицу в SQLite
            var existingNames = await _context.Categories.Select(c => c.Name).ToListAsync();
            if (existingNames.Any(n => string.Equals(n, name, StringComparison.OrdinalIgnoreCase)))
                throw new AppException("Категория с таким названием уже существует");

            var category = new Category { Name = name };
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return category;
        }

        public async Task<bool> Delete(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
                return false;

            // Товары не удаляем — просто отвязываем от категории
            var products = await _context.Products.Where(p => p.CategoryId == id).ToListAsync();
            foreach (var p in products)
                p.CategoryId = null;

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
