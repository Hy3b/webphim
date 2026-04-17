using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

/// <summary>
/// Controller quản lý thông tin phim.
/// Hỗ trợ cả Client (xem phim) và Admin (quản lý phim).
/// </summary>
[ApiController]
[Route("api/movies")]
public class MovieController(MovieService movieService) : ControllerBase
{
    /// <summary>
    /// Lấy danh sách toàn bộ phim cho Khách hàng. 
    /// Không phân trang để dễ dàng hiển thị lên slider/grid trang chủ.
    /// Có thể lọc theo trạng thái (showing/coming).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var movies = status is not null
            ? await movieService.GetByStatusAsync(status)
            : await movieService.GetAllAsync();
        return Ok(movies);
    }

    /// <summary>
    /// API dành riêng cho Admin để lấy danh sách phim có phân trang và tìm kiếm.
    /// Yêu cầu quyền "admin".
    /// </summary>
    [HttpGet("paged")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        var result = await movieService.GetPagedAsync(pageNumber, pageSize, search, status);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết một bộ phim theo ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var movie = await movieService.GetByIdAsync(id);
        return movie is null ? NotFound() : Ok(movie);
    }

    /// <summary>
    /// Thêm mới phim (Chỉ dành cho Admin).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateMovieRequest request)
    {
        var (movie, error) = await movieService.CreateAsync(request);
        if (error is not null) return BadRequest(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = movie!.MovieId }, movie);
    }

    /// <summary>
    /// Cập nhật thông tin phim (Chỉ dành cho Admin).
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateMovieRequest request)
    {
        var (movie, error) = await movieService.UpdateAsync(id, request);
        if (movie is null && error is null) return NotFound();
        if (error is not null) return BadRequest(new { message = error });
        return Ok(movie);
    }

    /// <summary>
    /// Xóa phim bằng kỹ thuật Soft Delete (đánh dấu IsDeleted = true).
    /// Kiểm tra ràng buộc: không cho xóa nếu phim đang có suất chiếu tương lai có người đặt.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var (success, error) = await movieService.SoftDeleteAsync(id);
        if (!success && error is null) return NotFound();
        if (error is not null) return BadRequest(new { message = error });
        return NoContent();
    }

    /// <summary>
    /// Xuất bản (Publish) bộ phim nháp lên Web Khách hàng.
    /// </summary>
    [HttpPost("{id:int}/publish")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Publish(int id, [FromQuery] string status = "showing")
    {
        var (success, error) = await movieService.PublishAsync(id, status);
        if (!success && error is null) return NotFound();
        if (error is not null) return BadRequest(new { message = error });
        return Ok(new { message = "Đã xuất bản phim lên website." });
    }
}
