using Microsoft.EntityFrameworkCore;
using MiniShop.Models;
using MiniShop.Services;

namespace MiniShop.Tests
{
    public class CategoryServiceTests
    {
        [Fact]
        public async Task Create_Success()
        {
            using var db = new TestDb();
            var svc = new CategoryService(db.Context);

            var category = await svc.Create("Канцелярия");

            Assert.True(category.Id > 0);
            Assert.Equal("Канцелярия", category.Name);
            Assert.Equal(1, await db.Context.Categories.CountAsync());
        }

        [Fact]
        public async Task Create_DuplicateName_Throws()
        {
            using var db = new TestDb();
            var svc = new CategoryService(db.Context);

            await svc.Create("Бумага");
            var ex = await Assert.ThrowsAsync<AppException>(() => svc.Create("бумага"));
            Assert.Contains("уже существует", ex.Message);
        }

        [Fact]
        public async Task Create_EmptyName_Throws()
        {
            using var db = new TestDb();
            var svc = new CategoryService(db.Context);

            await Assert.ThrowsAsync<AppException>(() => svc.Create("   "));
        }

        [Fact]
        public async Task Delete_Existing_UnlinksProducts()
        {
            using var db = new TestDb();
            var ctx = db.Context;
            var svc = new CategoryService(ctx);

            var category = await svc.Create("Временная");
            ctx.Products.Add(new Product
            {
                Name = "Товар",
                Price = 10,
                Stock = 1,
                imageUrl = "",
                CategoryId = category.Id
            });
            await ctx.SaveChangesAsync();

            var deleted = await svc.Delete(category.Id);

            Assert.True(deleted);
            Assert.Equal(0, await ctx.Categories.CountAsync());

            // Товар остаётся, но без категории
            var product = await ctx.Products.AsNoTracking().SingleAsync();
            Assert.Null(product.CategoryId);
        }

        [Fact]
        public async Task Delete_Missing_ReturnsFalse()
        {
            using var db = new TestDb();
            var svc = new CategoryService(db.Context);

            Assert.False(await svc.Delete(42));
        }
    }
}
