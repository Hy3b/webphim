using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

[ApiController]
[Route("api/admin/bookings")]
[Authorize(Roles = "admin,staff")]
public class AdminBookingController(AdminBookingService adminBookingService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> BookAtCounter([FromBody] AdminBookingRequest request)
    {
        try
        {
            var response = await adminBookingService.BookTicketsAtCounterAsync(request);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

[ApiController]
[Route("api/admin/tickets")]
[Authorize(Roles = "admin,staff")]
public class AdminTicketController(AdminTicketService adminTicketService) : ControllerBase
{
    [HttpPost("scan")]
    public async Task<IActionResult> ScanTicket([FromBody] TicketScanRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await adminTicketService.ScanTicketAsync(request.OrderCode);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
