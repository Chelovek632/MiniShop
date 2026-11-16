using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniShop.Interface;
using System.Security.Claims;
using static MiniShop.DTO;

namespace MiniShop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateCart([FromBody] CreateCartDto request)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                var cart = await _cartService.CreateCart(userId, request.Items);
                return Ok(cart);
            }
            catch (AppException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("getCart")]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                var cart = await _cartService.GetUserCart(userId);

                if (cart == null)
                    return Ok(new { items = new List<object>() });

                return Ok(cart);
            }
            catch (AppException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> DeleteCart()
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                await _cartService.DeleteCart(userId);
                return Ok(new { message = "Cart cleared" });
            }
            catch (AppException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}