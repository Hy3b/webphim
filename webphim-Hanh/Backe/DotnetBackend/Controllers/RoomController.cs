using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebPhimApi.Data;

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
}
