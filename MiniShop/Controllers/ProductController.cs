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

    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly IJwtProvider _jwtProvider;

        public ProductController(IProductService productService, IJwtProvider jwtProvider)
        {
            _productService = productService;
            _jwtProvider = jwtProvider;
        }

        [AllowAnonymous]
        [HttpGet("all")]
        public async Task<IActionResult> GetAll()
        {

            var products = await _productService.GetAll();

            // Маппинг в DTO
            var result = products.Select(p => new ProductDto
            {
                id = p.Id,
                Stock = p.Id,
                Name = p.Name,
                Price = p.Price,
                Imageurl = p.imageUrl
            });

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {

            var product = await _productService.GetById(id);

            if (product == null)
                return NotFound(new { error = "Product not found" });

            var productDto = new ProductDto
            {
                id = product.Id,
                Name = product.Name,
                Price = product.Price,
                Stock = product.Stock
            };

            return Ok(productDto);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto request)
        {
            var product = await _productService.Create(request.Name, request.Price, request.Stock, request.Imageurl);
            var productDto = new ProductDto
            {
                id = product.Id,
                Name = product.Name,
                Price = product.Price,
                Stock = product.Stock,
                Imageurl = product.imageUrl
            };
            return Ok(productDto);
        }
        [Authorize(Roles = "Admin")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductCreateDto request)
        {
            var success = await _productService.Update(id, request.Name, request.Price, request.Stock);
            if (!success)
                return NotFound(new { error = "Product not found" });
            return Ok(new { message = "Product updated successfully" });
        }
        [Authorize(Roles = "Admin")]
        [HttpDelete("delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _productService.Delete(id);
            if (!success)
                return NotFound(new { error = "Product not found" });
            return Ok(new { message = "Product deleted successfully" });
        }
    } 
}
