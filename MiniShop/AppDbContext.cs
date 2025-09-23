using Microsoft.EntityFrameworkCore;
using MiniShop.Models;


namespace MiniShop
{
     public class AppDbContext : DbContext
     {
        public AppDbContext()
        {
        }

        public AppDbContext(DbContextOptions options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }


    }

}
