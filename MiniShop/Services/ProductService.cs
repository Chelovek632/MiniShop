using Microsoft.EntityFrameworkCore;
using MiniShop;
using MiniShop.Interface;
using MiniShop.Models;

namespace MiniShop.Services
{
    // Сервис для работы с продуктами
    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;

        // Прокидываем DbContext
        public ProductService(AppDbContext context)
        {
            _context = context;
        }

        // Забираем вообще все товары из базы
        // Без фильтров, без условий, просто всё
        public async Task<List<Product>> GetAll()
        {
            return await _context.Products.ToListAsync();
        }

        // Ищем товар по id
        // Если не нашли, вернётся null 
        public async Task<Product?> GetById(int id)
        {
            return await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        }

        // Создание нового товара
        // Просто берём данные и закидываем в базу
        public async Task<Product> Create(string name, decimal price, int stock, string imageurl)
        {
            // Собираем объект товара
            var product = new Product
            {
                Name = name,
                Price = price,
                Stock = stock,
                imageUrl = imageurl
            };

            // Добавляем в контекст
            _context.Products.Add(product);

            // Сохраняем, чтобы он реально появился в базе
            await _context.SaveChangesAsync();

            return product;
        }

        // Обновление товара по id
        // Если товара нет, просто говорим, чтоб нахер шёл, ничего нет
        public async Task<bool> Update(int id, string name, decimal price, int stock, string Imageurl)
        {
            // Пытаемся найти товар
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);

            // Если не нашли, дальше смысла нет
            if (product == null)
            {
                return false;
            }

            // Переписываем значения
            product.Name = name;
            product.Price = price;
            product.Stock = stock;
            product.imageUrl = Imageurl;

            // Говорим EF что товар обновился
            _context.Products.Update(product);

            // Фиксируем изменения
            await _context.SaveChangesAsync();

            return true;
        }

        // Удаление товара
        // Опять же, если не нашли, просто false
        public async Task<bool> Delete(int id)
        {
            // Ищем товар
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);

            // Нечего удалять
            if (product == null)
            {
                return false;
            }

            // Выпиливаем из базы
            _context.Products.Remove(product);

            // Сохраняем, чтобы он реально исчез
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
