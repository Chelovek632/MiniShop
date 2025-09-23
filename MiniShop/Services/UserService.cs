using Microsoft.EntityFrameworkCore;
using MiniShop;
using MiniShop.Interface;
using MiniShop.Models;
namespace MiniShop.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;

        }

        public async Task<User> Login(string username, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Login == username);

            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                throw new Exception("Неверное имя пользователя или пароль.");
            }

            return user;
        }

        public async Task Register(string username, string password)
        {
            var existingUser = await _context.Users.AnyAsync(u => u.Login == username);
            if (existingUser)
            {
                throw new Exception("Пользователь с таким именем уже существует.");
            }

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Login = username,
                PasswordHash = hashedPassword
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        public async Task<User> FindById(int id)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        }
    }
}