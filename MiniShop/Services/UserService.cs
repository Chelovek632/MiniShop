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
                throw new Exception("Неверное имя пользователя или пароль.");
            }

            // Всё ок, возвращаем пользователя
            return user;
        }

        // Регистрация нового пользователя
        public async Task Register(string username, string password)
        {
            // Проверяем, нет ли уже такого логина
            var existingUser = await _context.Users.AnyAsync(u => u.Login == username);

            if (existingUser)
            {
                throw new Exception("Пользователь с таким именем уже существует.");
            }

            // Хэшируем пароль, в открытом виде ничерта не храним, а то шо мы ебланы шоль
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

            // Создаём пользователя
            var user = new User
            {
                Login = username,
                PasswordHash = hashedPassword
            };

            // Добавляем в базу юзера
            _context.Users.Add(user);

            // Сохраняем, чтоб не проебался в моменте
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
