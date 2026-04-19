using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

// ════════════════════════════════════════════════════════════════════════════
//  Admin — Room Controller
// ════════════════════════════════════════════════════════════════════════════

[ApiController]
[Route("api/admin/rooms")]
[Authorize(Roles = "admin")]
public class AdminRoomController(RoomService roomService) : ControllerBase
{
    /// <summary>
    /// GET /api/admin/rooms?pageNumber=1&pageSize=10&search=
    /// Lấy danh sách phòng có phân trang.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize   = 10,
        [FromQuery] string? search = null)
    {
        var result = await roomService.GetPagedAsync(pageNumber, pageSize, search);
        return Ok(result);
    }

    /// <summary>
    /// GET /api/admin/rooms/all
    /// Lấy toàn bộ danh sách phòng (không phân trang, dùng cho dropdown).
    /// </summary>
    [HttpGet("all")]
    public async Task<IActionResult> GetAll()
    {
        var rooms = await roomService.GetAllAsync();
        return Ok(rooms);
    }

    /// <summary>
    /// GET /api/admin/rooms/{id}
    /// Lấy chi tiết một phòng.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var room = await roomService.GetByIdAsync(id);
        if (room is null) return NotFound(new { message = "Không tìm thấy phòng chiếu." });
        return Ok(room);
    }

    /// <summary>
    /// POST /api/admin/rooms
    /// Tạo mới phòng chiếu.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoomRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (room, error) = await roomService.CreateAsync(request);

        if (error is not null) return BadRequest(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = room!.RoomId }, room);
    }

    /// <summary>
    /// PUT /api/admin/rooms/{id}
    /// Cập nhật thông tin phòng chiếu.
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateRoomRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (room, error) = await roomService.UpdateAsync(id, request);

        if (error is not null) return BadRequest(new { message = error });
        if (room is null)      return NotFound(new { message = "Không tìm thấy phòng chiếu." });
        return Ok(room);
    }

    /// <summary>
    /// DELETE /api/admin/rooms/{id}
    /// Xóa phòng chiếu.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var (success, error) = await roomService.DeleteAsync(id);

        if (error is not null) return BadRequest(new { message = error });
        if (!success)          return NotFound(new { message = "Không tìm thấy phòng chiếu." });
        return NoContent();
    }
}

// ════════════════════════════════════════════════════════════════════════════
//  Admin — Seat Controller
// ════════════════════════════════════════════════════════════════════════════

[ApiController]
[Route("api/admin/seats")]
[Authorize(Roles = "admin")]
public class AdminSeatController(SeatService seatService) : ControllerBase
{
    /// <summary>
    /// GET /api/admin/seats/room/{roomId}
    /// Lấy toàn bộ ghế của một phòng, kèm thông tin SeatType.
    /// </summary>
    [HttpGet("room/{roomId:int}")]
    public async Task<IActionResult> GetByRoom(int roomId)
    {
        var seats = await seatService.GetByRoomIdAsync(roomId);
        return Ok(seats);
    }

    /// <summary>
    /// GET /api/admin/seats/types
    /// Lấy danh sách loại ghế (dùng cho dropdown lựa chọn khi edit sơ đồ).
    /// </summary>
    [HttpGet("types")]
    public async Task<IActionResult> GetSeatTypes()
    {
        var types = await seatService.GetAllSeatTypesAsync();
        return Ok(types);
    }

    /// <summary>
    /// PUT /api/admin/seats/room/{roomId}/map
    /// Cập nhật loại ghế hàng loạt cho sơ đồ ghế.
    /// </summary>
    [HttpPut("room/{roomId:int}/map")]
    public async Task<IActionResult> UpdateSeatMap(int roomId, [FromBody] UpdateSeatMapRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (updatedCount, error) = await seatService.UpdateSeatMapAsync(roomId, request);

        if (error is not null) return BadRequest(new { message = error });
        return Ok(new { message = $"Đã cập nhật {updatedCount} ghế thành công.", updatedCount });
    }

    /// <summary>
    /// POST /api/admin/seats/room/{roomId}/generate
    /// Khởi tạo sơ đồ ghế trống theo lưới rows x columns.
    /// </summary>
    [HttpPost("room/{roomId:int}/generate")]
    public async Task<IActionResult> GenerateSeatMap(int roomId, [FromBody] GenerateSeatMapRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (createdCount, error) = await seatService.InitializeSeatMapAsync(roomId, request);

        if (error is not null) return BadRequest(new { message = error });
        return Ok(new { message = $"Đã khởi tạo thành công {createdCount} ghế cho phòng.", createdCount });
    }

    /// <summary>
    /// DELETE /api/admin/seats/room/{roomId}
    /// Xóa toàn bộ sơ đồ ghế của phòng.
    /// </summary>
    [HttpDelete("room/{roomId:int}")]
    public async Task<IActionResult> DeleteSeatMap(int roomId)
    {
        var (success, error) = await seatService.DeleteAllByRoomIdAsync(roomId);

        if (error is not null) return BadRequest(new { message = error });
        if (!success) return NotFound(new { message = "Không tìm thấy sơ đồ ghế." });
        return Ok(new { message = "Đã xoá toàn bộ sơ đồ ghế thành công." });
    }
}
