using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniShop.Interface;
using static MiniShop.DTO;

namespace MiniShop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [AllowAnonymous]
        [HttpGet("all")]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _categoryService.GetAll();
            var result = categories.Select(c => new CategoryDto
            {
                id = c.Id,
                Name = c.Name
            });
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CategoryCreateDto request)
        {
            var category = await _categoryService.Create(request.Name);
            return Ok(new CategoryDto { id = category.Id, Name = category.Name });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _categoryService.Delete(id);
            if (!success)
                return NotFound(new { error = "Категория не найдена" });
            return Ok(new { message = "Категория удалена" });
        }
    }
}
