using MiniShop.Models;
using static MiniShop.DTO;

namespace MiniShop.Interface
{
    public interface IProductService
    {
        Task<PagedProductsDto> Search(string? search, int? categoryId, int page, int pageSize);
        Task<Product?> GetById(int id);
        Task<Product> Create(string name, decimal price, int stock, string imageurl, int? categoryId);
        Task<bool> Update(int id, string? name, decimal? price, int? stock, string? imageurl, int? categoryId);
        Task<bool> Delete(int id);
    }
}
