using MiniShop.Models;

namespace MiniShop.Interface
{
    public interface ICategoryService
    {
        Task<List<Category>> GetAll();
        Task<Category> Create(string name);
        Task<bool> Delete(int id);
    }
}
