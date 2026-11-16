using Microsoft.EntityFrameworkCore;
using MiniShop.Models;
using MiniShop.Models.Enums;
using MiniShop.Services;
using static MiniShop.DTO;

namespace MiniShop.Tests
{
    public class OrderServiceTests
    {
        private const string ValidAddress = "Москва, ул. Ленина, 15";

        // Общий сетап: пользователь + два товара (5 и 3 шт.)
        private static (OrderService svc, TestDb db, Product cheap, Product rare) Setup()
        {
            var db = new TestDb();
            var ctx = db.Context;

            var user = new User { Login = "buyer", PasswordHash = "hash" };
            ctx.Users.Add(user);

            var cheap = new Product { Name = "Бумага А4", Price = 10, Stock = 5, imageUrl = "" };
            var rare = new Product { Name = "Степлер", Price = 50, Stock = 3, imageUrl = "" };
            ctx.Products.AddRange(cheap, rare);
            ctx.SaveChanges();

            return (new OrderService(ctx), db, cheap, rare);
        }

        [Fact]
        public async Task CreateOrder_TooShortAddress_Throws()
        {
            var (svc, db, _, _) = Setup();
            using (db)
            {
                var ex = await Assert.ThrowsAsync<AppException>(() =>
                    svc.CreateOrder(1, Items(1, 1), "короткий"));
                Assert.Contains("адрес", ex.Message, StringComparison.OrdinalIgnoreCase);
            }
        }

        [Fact]
        public async Task CreateOrder_AddressWithoutHouseNumber_Throws()
        {
            var (svc, db, _, _) = Setup();
            using (db)
            {
                var ex = await Assert.ThrowsAsync<AppException>(() =>
                    svc.CreateOrder(1, Items(1, 1), "Москва улица Ленина без номера дома"));
                Assert.Contains("номер дома", ex.Message);
            }
        }

        [Fact]
        public async Task CreateOrder_AddressTooFewWords_Throws()
        {
            var (svc, db, _, _) = Setup();
            using (db)
            {
                // 10+ символов, есть цифра, но только 2 слова (нет улицы)
                var ex = await Assert.ThrowsAsync<AppException>(() =>
                    svc.CreateOrder(1, Items(1, 1), "Москва 155"));
                Assert.Contains("город, улица", ex.Message);
            }
        }

        [Fact]
        public async Task CreateOrder_EmptyItems_Throws()
        {
            var (svc, db, _, _) = Setup();
            using (db)
            {
                var ex = await Assert.ThrowsAsync<AppException>(() =>
                    svc.CreateOrder(1, new List<OrderItemDto>(), ValidAddress));
                Assert.Contains("Корзина пуста", ex.Message);
            }
        }

        [Fact]
        public async Task CreateOrder_InsufficientStock_Throws_AndStockUnchanged()
        {
            var (svc, db, cheap, _) = Setup();
            using (db)
            {
                // Заказать 10 при стоке 5 — отказ, сток не должен измениться
                await Assert.ThrowsAsync<AppException>(() =>
                    svc.CreateOrder(1, Items(cheap.Id, 10), ValidAddress));

                var reloaded = await db.Context.Products.AsNoTracking().FirstAsync(p => p.Id == cheap.Id);
                Assert.Equal(5, reloaded.Stock);

                var orderCount = await db.Context.Orders.CountAsync();
                Assert.Equal(0, orderCount);
            }
        }

        [Fact]
        public async Task CreateOrder_Success_DecrementsStock()
        {
            var (svc, db, cheap, rare) = Setup();
            using (db)
            {
                var order = await svc.CreateOrder(1,
                    new List<OrderItemDto>
                    {
                        new() { ProductId = cheap.Id, Quantity = 2 },
                        new() { ProductId = rare.Id, Quantity = 1 }
                    },
                    ValidAddress);

                Assert.Equal(OrderStatus.Pending, order.Status);
                Assert.Equal(2, order.Items.Count);

                var reloadedCheap = await db.Context.Products.AsNoTracking().FirstAsync(p => p.Id == cheap.Id);
                var reloadedRare = await db.Context.Products.AsNoTracking().FirstAsync(p => p.Id == rare.Id);
                Assert.Equal(3, reloadedCheap.Stock); // 5 - 2
                Assert.Equal(2, reloadedRare.Stock);  // 3 - 1
            }
        }

        [Fact]
        public async Task CreateOrder_MissingProduct_Throws()
        {
            var (svc, db, _, _) = Setup();
            using (db)
            {
                var ex = await Assert.ThrowsAsync<AppException>(() =>
                    svc.CreateOrder(1, Items(999, 1), ValidAddress));
                Assert.Contains("не найден", ex.Message);
            }
        }

        [Fact]
        public async Task UpdateStatus_MissingOrder_Throws404()
        {
            var (svc, db, _, _) = Setup();
            using (db)
            {
                var ex = await Assert.ThrowsAsync<AppException>(() =>
                    svc.UpdateStatus(999, OrderStatus.Paid));
                Assert.Equal(404, ex.StatusCode);
            }
        }

        [Fact]
        public async Task UpdateStatus_InvalidTransition_Throws()
        {
            var (svc, db, cheap, _) = Setup();
            using (db)
            {
                var order = await svc.CreateOrder(1, Items(cheap.Id, 1), ValidAddress);

                // Pending -> Shipped минуя Paid — запрещено
                var ex = await Assert.ThrowsAsync<AppException>(() =>
                    svc.UpdateStatus(order.Id, OrderStatus.Shipped));
                Assert.Contains("Недопустимый переход", ex.Message);
            }
        }

        [Fact]
        public async Task UpdateStatus_ValidTransition_Works()
        {
            var (svc, db, cheap, _) = Setup();
            using (db)
            {
                var order = await svc.CreateOrder(1, Items(cheap.Id, 1), ValidAddress);

                await svc.UpdateStatus(order.Id, OrderStatus.Paid);

                var reloaded = await db.Context.Orders.AsNoTracking().FirstAsync(o => o.Id == order.Id);
                Assert.Equal(OrderStatus.Paid, reloaded.Status);
            }
        }

        [Fact]
        public async Task UpdateStatus_FromCanceled_IsForbidden()
        {
            var (svc, db, cheap, _) = Setup();
            using (db)
            {
                var order = await svc.CreateOrder(1, Items(cheap.Id, 1), ValidAddress);
                await svc.UpdateStatus(order.Id, OrderStatus.Canceled);

                await Assert.ThrowsAsync<AppException>(() =>
                    svc.UpdateStatus(order.Id, OrderStatus.Paid));
            }
        }

        private static List<OrderItemDto> Items(int productId, int quantity) =>
            new() { new OrderItemDto { ProductId = productId, Quantity = quantity } };
    }
}
