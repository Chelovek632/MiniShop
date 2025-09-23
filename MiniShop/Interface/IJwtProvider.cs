using MiniShop.Models;
namespace MiniShop.Interface
{
    public interface IJwtProvider
    {
        string GenerateToken(User user);

    }
}
