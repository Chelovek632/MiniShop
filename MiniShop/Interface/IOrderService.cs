using MiniShop.Models;
using Npgsql.PostgresTypes;
using static MiniShop.DTO;

namespace MiniShop.Interface
{
    public interface IOrderService
    {
        Task<Order> CreateOrder(int userId, List<OrderItemDto> items);
        Task<List<Order>> GetUserOrders(int userId);
        Task<Order?> GetById(int id, int userId);
    }
}
