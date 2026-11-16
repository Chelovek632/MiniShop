namespace MiniShop.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string imageUrl { get; set; } = string.Empty;

        // Категория опциональна: null = без категории
        public int? CategoryId { get; set; }
        public Category? Category { get; set; }
    }
}
