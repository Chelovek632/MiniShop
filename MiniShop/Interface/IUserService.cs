using MiniShop.Models;

namespace MiniShop.Interface
{
    public interface IUserService
    {
        Task Register(string username, string password);
        Task<User> Login(string username, string password);
        Task<User> FindById(int id);
    }
}
