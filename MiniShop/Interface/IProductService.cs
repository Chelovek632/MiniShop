using MiniShop.Models;
using static MiniShop.DTO;

namespace MiniShop.Interface
{
    public interface IProductService
    {
        Task<List<Product>> GetAll();
        Task<Product?> GetById(int id);
        Task<Product> Create(string name, decimal price, int stock, string imageurl);
        Task<bool> Update(int id, string? name, decimal? price, int? stock, string? imageurl);
        Task<bool> Delete(int id);
    }
}