using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebPhimApi.Data;
using WebPhimApi.Entities;

namespace WebPhimApi.Controllers;

[ApiController]
[Route("api/rooms")]
public class RoomController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var rooms = await db.Rooms
            .Select(r => new { r.RoomId, r.Name })
            .ToListAsync();
        return Ok(rooms);
    }

    [HttpGet("seat-types")]
    public async Task<IActionResult> GetSeatTypes()
    {
        var seatTypes = await db.SeatTypes
            .Select(s => new { s.SeatTypeId, Name = s.Name, Surcharge = s.Surcharge })
            .ToListAsync();
        return Ok(seatTypes);
    }

    [HttpGet("pricing")]
    public async Task<IActionResult> GetRoomPricing()
    {
        // Lấy danh sách các phòng chiếu và giá gốc cơ bản (lấy từ base_price của các suất chiếu hoặc mặc định)
        var rooms = await db.Rooms
            .Select(r => new
            {
                r.RoomId,
                r.Name,
                BasePrice = db.Showtimes
                    .Where(s => s.RoomId == r.RoomId && s.Status == ShowtimeStatus.active)
                    .Select(s => (decimal?)s.BasePrice)
                    .FirstOrDefault() ?? 75000 // Fallback mặc định nếu chưa có suất chiếu
            })
            .ToListAsync();
        return Ok(rooms);
    }
}
