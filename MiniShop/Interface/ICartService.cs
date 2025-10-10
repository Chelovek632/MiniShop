using MiniShop.Models;
using Npgsql.PostgresTypes;
using static MiniShop.DTO;

namespace MiniShop.Interface
{
    public interface ICartService
    {
        Task<Cart> CreateCart(int userId, List<CartItemDto> items);
        Task<List<Cart>> GetUserCarts(int userId);

        Task DeleteCarts(int userId);
        //Task<Cart?> GetById(int id, int userId);
    }
}
