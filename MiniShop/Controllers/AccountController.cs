using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static MiniShop.DTO;
using MiniShop.Interface;

namespace MiniShop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IJwtProvider _jwtProvider;

        public AccountController(IUserService userService, IJwtProvider jwtProvider)
        {
            _userService = userService;
            _jwtProvider = jwtProvider;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                var user = await _userService.Login(request.Login, request.Password);
                var token = _jwtProvider.GenerateToken(user);

                return Ok(new
                {
                    user.Id,
                    user.Login,
                    user.Role,
                    Token = token
                });
            }
            catch (AppException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                await _userService.Register(request.Login, request.Password);
                return Ok(new { message = "Регистрация успешна" });
            }
            catch (AppException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // Токен не отзывается (нет blacklist) — клиент удаляет его сам.
            // [Authorize] нужен, чтобы logout нельзя было вызвать без валидного токена.
            return Ok(new { message = "Вы вышли" });
        }
    }
}
