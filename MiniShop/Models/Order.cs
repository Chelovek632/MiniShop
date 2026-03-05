using MiniShop.Models.Enums;

namespace MiniShop.Models
{
    public class Order
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public string Address { get; set; }
        public List<OrderItem> Items { get; set; }
    }

}
