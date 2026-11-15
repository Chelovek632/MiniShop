using MiniShop.Models;
using static MiniShop.DTO;

namespace MiniShop.Interface
{
    public interface ICartService
    {
        Task<Cart> CreateCart(int userId, List<CartItemDto> items);
        Task<Cart?> GetUserCart(int userId);
        Task DeleteCart(int userId);
    }
}
