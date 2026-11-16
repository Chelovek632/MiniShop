using Microsoft.EntityFrameworkCore;
using MiniShop;
using MiniShop.Interface;
using MiniShop.Models;

namespace MiniShop.Services
{
    // Сервис для работы с пользователями
    // Тут логин, регистрация и поиск по id
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        // Подключаем контекст базы
        public UserService(AppDbContext context)
        {
            _context = context;
        }

        // Логин пользователя
        // Проверяем, что такой пользователь есть и пароль совпадает
        public async Task<User> Login(string username, string password)
        {
            // Ищем пользователя по логину
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Login == username);

            // Если пользователя нет или пароль не совпал — сразу вылетаем
            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                throw new AppException("Неверное имя пользователя или пароль.");
            }

            // Всё номана, возвращаем пользователя
            return user;
        }

        // Регистрация нового пользователя
        public async Task Register(string username, string password)
        {
            // Валидация логина
            if (string.IsNullOrWhiteSpace(username))
                throw new AppException("Логин не может быть пустым.");

            if (username.Length < 3)
                throw new AppException("Логин должен содержать не менее 3 символов.");

            if (username.Length > 50)
                throw new AppException("Логин не может быть длиннее 50 символов.");

            // Валидация пароля
            if (string.IsNullOrWhiteSpace(password))
                throw new AppException("Пароль не может быть пустым.");

            if (password.Length < 6)
                throw new AppException("Пароль должен содержать не менее 6 символов.");

            // Проверка уникальности логина
            var existingUser = await _context.Users.AnyAsync(u => u.Login == username);
            if (existingUser)
                throw new AppException("Пользователь с таким именем уже существует.");

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Login = username,
                PasswordHash = hashedPassword
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        // Поиск пользователя по id
        // Используется, когда надо достать текущего юзера
        public async Task<User> FindById(int id)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        }
    }
}
