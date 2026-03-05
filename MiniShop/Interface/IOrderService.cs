using MiniShop.Models;
using MiniShop.Models.Enums;
using Npgsql.PostgresTypes;
using static MiniShop.DTO;

namespace MiniShop.Interface
{
    public interface IOrderService
    {
        Task<Order> CreateOrder(int userId, List<OrderItemDto> items, string address);
        Task<List<Order>> GetUserOrders(int userId);
        Task<Order?> GetById(int id, int userId);
        Task UpdateStatus(int orderId, OrderStatus status);
        Task<List<AdminOrderDto>> GetAllOrdersForAdmin();

    }
}
