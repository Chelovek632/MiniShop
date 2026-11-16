using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniShop.Interface;
using MiniShop.Models;
using static MiniShop.DTO;

namespace MiniShop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;

        private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        private const long MaxUploadBytes = 5 * 1024 * 1024; // 5 МБ

        public ProductController(IProductService productService)
        {
            _productService = productService;
        }

        // Каталог: ?search=...&category=...&page=1&pageSize=12
        [AllowAnonymous]
        [HttpGet("all")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] int? category,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12)
        {
            var result = await _productService.Search(search, category, page, pageSize);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _productService.GetById(id);
            if (product == null)
                return NotFound(new { error = "Product not found" });

            return Ok(new ProductDto
            {
                id = product.Id,
                Name = product.Name,
                Price = product.Price,
                Stock = product.Stock,
                Imageurl = product.imageUrl,
                CategoryId = product.CategoryId,
                CategoryName = product.Category?.Name
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto request)
        {
            var product = await _productService.Create(
                request.Name, request.Price, request.Stock,
                request.Imageurl ?? string.Empty, request.CategoryId);

            return Ok(new ProductDto
            {
                id = product.Id,
                Name = product.Name,
                Price = product.Price,
                Stock = product.Stock,
                Imageurl = product.imageUrl,
                CategoryId = product.CategoryId
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto request)
        {
            // Проверяем что хотя бы одно поле передано
            if (request.Name == null && request.Price == null &&
                request.Stock == null && request.Imageurl == null && request.CategoryId == null)
                return BadRequest(new { error = "Не передано ни одного поля для обновления" });

            var success = await _productService.Update(
                id, request.Name, request.Price, request.Stock, request.Imageurl, request.CategoryId);

            if (!success)
                return NotFound(new { error = "Product not found" });

            return Ok(new { message = "Product updated successfully" });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _productService.Delete(id);
                if (!success)
                    return NotFound(new { error = "Product not found" });
                return Ok(new { message = "Product deleted successfully" });
            }
            catch (AppException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Загрузка картинки товара на сервер → /uploads/...
        [Authorize(Roles = "Admin")]
        [HttpPost("upload")]
        [RequestSizeLimit(MaxUploadBytes)]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "Файл не выбран" });

            if (file.Length > MaxUploadBytes)
                return BadRequest(new { error = "Файл больше 5 МБ" });

            var extension = Path.GetExtension(file.FileName ?? string.Empty).ToLowerInvariant();
            if (!AllowedImageExtensions.Contains(extension))
                return BadRequest(new { error = "Допустимы только jpg, jpeg, png, webp, gif" });

            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadsDir, fileName);

            await using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { url = $"/uploads/{fileName}" });
        }
    }
}
