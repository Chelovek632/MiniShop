using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniShop.Interface;
using MiniShop.Models;
using System.Security.Claims;
using static MiniShop.DTO;

namespace MiniShop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]

    public class CartController : ControllerBase
    {
        private readonly ICartService _CartService;
        private readonly IJwtProvider _jwtProvider;

        public CartController(ICartService CartService, IJwtProvider jwtProvider)
        {
            _CartService = CartService;
            _jwtProvider = jwtProvider;
        }
        //var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        [HttpPost("create")]
        public async Task<IActionResult> CreateCart([FromBody] CreateCartDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                var Cart = await _CartService.CreateCart(userId, request.Items);
                return Ok(Cart);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("getCarts")]
        public async Task<IActionResult> GetCartsByUser()
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                var Carts = await _CartService.GetUserCarts(userId);
                return Ok(Carts);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("clear")]

        public async Task<IActionResult> DeleteCartsByUser()
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                await _CartService.DeleteCarts(userId);
                return Ok(new { message = "Carts deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
