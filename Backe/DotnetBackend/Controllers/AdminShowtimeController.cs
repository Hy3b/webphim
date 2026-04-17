using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

/// <summary>
/// Controller dành cho Admin quản lý suất chiếu.
/// Yêu cầu quyền truy cập "admin".
/// </summary>
[ApiController]
[Route("api/admin/showtimes")]
[Authorize(Roles = "admin")]
public class AdminShowtimeController(ShowtimeService showtimeService) : ControllerBase
{
    /// <summary>
    /// Lấy danh sách suất chiếu cho Admin (bao gồm thông tin doanh số vé).
    /// Có thể lọc theo ngày và phòng chiếu.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateOnly? date,
        [FromQuery] int? roomId)
    {
        var showtimes = await showtimeService.GetAdminShowtimesAsync(date, roomId);
        return Ok(showtimes);
    }
    
    /// <summary>
    /// Lấy chi tiết một suất chiếu theo ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var showtime = await showtimeService.GetDetailAsync(id);
        return showtime is null ? NotFound() : Ok(showtime);

    }

    /// <summary>
    /// Tạo mới một suất chiếu. 
    /// Hệ thống sẽ kiểm tra trùng lịch (overlap) trước khi lưu.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShowtimeRequest request)
    {
        var (showtime, error) = await showtimeService.CreateAsync(request);
        if (error is not null) return BadRequest(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = showtime!.ShowtimeId }, showtime);
    }

    /// <summary>
    /// Cập nhật thông tin suất chiếu. 
    /// Nếu thay đổi, Redis cache liên quan sẽ bị xóa để đảm bảo tính nhất quán.
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateShowtimeRequest request)
    {
        var (showtime, error) = await showtimeService.UpdateAsync(id, request);
        if (showtime is null && error is null) return NotFound();
        if (error is not null) return BadRequest(new { message = error });
        return Ok(showtime);
    }

    /// <summary>
    /// Hủy suất chiếu (Soft Delete). 
    /// Xóa các phiên đặt chỗ liên quan trong Redis.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id)
    {
        var (success, error) = await showtimeService.CancelAsync(id);
        if (!success && error is null) return NotFound();
        if (error is not null) return BadRequest(new { message = error });
        return NoContent();
    }

    /// <summary>
    /// Xuất bản (Publish) suất chiếu nháp lên Web Khách hàng.
    /// </summary>
    [HttpPost("{id:int}/publish")]
    public async Task<IActionResult> Publish(int id)
    {
        var (success, error) = await showtimeService.PublishAsync(id);
        if (!success && error is null) return NotFound();
        if (error is not null) return BadRequest(new { message = error });
        return Ok(new { message = "Đã xuất bản suất chiếu lên website." });
    }

    /// <summary>
    /// Tự động tạo lịch chiếu cho một phim trong khung giờ mở/đóng cửa.
    /// Thuật toán sẽ tính toán các khoảng nghỉ (cleaning time) giữa các suất.
    /// </summary>
    [HttpPost("auto-generate")]
    public async Task<IActionResult> AutoGenerate([FromBody] AutoGenerateRequest request)
    {
        if (request.RoomIds is null || request.RoomIds.Count == 0)
            return BadRequest(new { message = "Phải chọn ít nhất 1 phòng chiếu." });

        if (request.OpenTime >= request.CloseTime)
            return BadRequest(new { message = "Giờ mở cửa phải trước giờ đóng cửa." });

        var (result, error) = await showtimeService.AutoGenerateAsync(request);
        if (error is not null) return BadRequest(new { message = error });

        return Ok(new
        {
            message = $"Đã tạo {result.CreatedCount} suất chiếu.",
            result.CreatedCount,
            result.Conflicts
        });
    }
}
