using Microsoft.EntityFrameworkCore;
using MiniShop.Models;
using MiniShop.Services;

namespace MiniShop.Tests
{
    public class ProductServiceTests
    {
        [Fact]
        public async Task Search_FiltersByCategoryAndPaginates()
        {
            using var db = new TestDb();
            var ctx = db.Context;
            var svc = new ProductService(ctx);

            var cat = new Category { Name = "Кружки" };
            ctx.Categories.Add(cat);
            ctx.SaveChanges();

            for (var i = 1; i <= 5; i++)
            {
                ctx.Products.Add(new Product
                {
                    Name = i <= 3 ? $"Кружка {i}" : $"Бумага {i}",
                    Price = i,
                    Stock = 1,
                    imageUrl = "",
                    CategoryId = i <= 3 ? cat.Id : null
                });
            }
            await ctx.SaveChangesAsync();

            // Фильтр по категории + пагинация
            var page1 = await svc.Search(null, cat.Id, 1, 2);
            Assert.Equal(3, page1.total);
            Assert.Equal(2, page1.items.Count);
            Assert.Equal(1, page1.page);

            var page2 = await svc.Search(null, cat.Id, 2, 2);
            Assert.Equal(1, page2.items.Count);

            // Поиск по названию
            var search = await svc.Search("бумага", null, 1, 10);
            Assert.Equal(2, search.total);
        }

        [Fact]
        public async Task Search_UnknownCategory_ReturnsEmpty()
        {
            using var db = new TestDb();
            var svc = new ProductService(db.Context);

            var result = await svc.Search(null, 777, 1, 10);

            Assert.Equal(0, result.total);
            Assert.Empty(result.items);
        }

        [Fact]
        public async Task Create_UnknownCategory_Throws()
        {
            using var db = new TestDb();
            var svc = new ProductService(db.Context);

            var ex = await Assert.ThrowsAsync<AppException>(() =>
                svc.Create("Товар", 10, 1, "", 777));
            Assert.Contains("Категория", ex.Message);
        }

        [Fact]
        public async Task Delete_ReferencedByCart_Throws()
        {
            using var db = new TestDb();
            var ctx = db.Context;
            var svc = new ProductService(ctx);

            var user = new User { Login = "buyer", PasswordHash = "hash" };
            var product = new Product { Name = "Товар", Price = 10, Stock = 1, imageUrl = "" };
            ctx.Users.Add(user);
            ctx.Products.Add(product);
            await ctx.SaveChangesAsync();

            var cart = new Cart { UserId = user.Id, Items = new List<CartItem>() };
            ctx.Carts.Add(cart);
            await ctx.SaveChangesAsync();

            ctx.CartItems.Add(new CartItem { CartId = cart.Id, ProductId = product.Id, Quantity = 1 });
            await ctx.SaveChangesAsync();

            var ex = await Assert.ThrowsAsync<AppException>(() => svc.Delete(product.Id));
            Assert.Contains("используется", ex.Message);

            // Товар не удалён
            Assert.True(await ctx.Products.AnyAsync(p => p.Id == product.Id));
        }

        [Fact]
        public async Task Delete_Unreferenced_Succeeds()
        {
            using var db = new TestDb();
            var ctx = db.Context;
            var svc = new ProductService(ctx);

            var product = new Product { Name = "Товар", Price = 10, Stock = 1, imageUrl = "" };
            ctx.Products.Add(product);
            await ctx.SaveChangesAsync();

            Assert.True(await svc.Delete(product.Id));
            Assert.False(await ctx.Products.AnyAsync(p => p.Id == product.Id));
        }

        [Fact]
        public async Task Update_OnlyChangedFields()
        {
            using var db = new TestDb();
            var ctx = db.Context;
            var svc = new ProductService(ctx);

            var product = new Product { Name = "Старое имя", Price = 10, Stock = 5, imageUrl = "a.png" };
            ctx.Products.Add(product);
            await ctx.SaveChangesAsync();

            var updated = await svc.Update(product.Id, null, 25, null, null, null);
            Assert.True(updated);

            var reloaded = await ctx.Products.AsNoTracking().SingleAsync();
            Assert.Equal("Старое имя", reloaded.Name); // не тронуто
            Assert.Equal(25, reloaded.Price);
            Assert.Equal(5, reloaded.Stock);
        }
    }
}
