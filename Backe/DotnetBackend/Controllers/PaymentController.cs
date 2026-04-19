using Microsoft.AspNetCore.Mvc;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace WebPhimApi.Controllers;

/// <summary>
/// Nhận webhook từ SePay và kiểm tra trạng thái thanh toán.
/// Tương đương PaymentController.java
/// </summary>
[ApiController]
[Route("api/payment")]
public class PaymentController(
    PaymentService paymentService,
    IConfiguration config,
    ILogger<PaymentController> logger) : ControllerBase
{
    private string SepaySecret => config["SepayWebhookSecret"] ?? "";

    // SePay verify URL bằng GET trước khi lưu webhook
    [HttpGet("sepay-webhook")]
    public IActionResult VerifyWebhook() => Ok(new { success = true });

    [HttpPost("sepay-webhook")]
    public async Task<IActionResult> HandleWebhook(
        [FromHeader(Name = "Authorization")] string? authorization,
        [FromBody] SePayWebhookRequest request)
    {
        // 1. Xác thực secret key
        if (!string.IsNullOrEmpty(SepaySecret))
        {
            if (authorization is null || !authorization.Contains(SepaySecret))
            {
                logger.LogWarning("❌ Webhook nhận được Secret Key không hợp lệ! Authorization: {Auth}", authorization);
                return Unauthorized(new { success = false, message = "Lỗi xác thực Token" });
            }
            logger.LogInformation("✅ Xác thực Secret Key SePay thành công!");
        }
        else
        {
            logger.LogWarning("⚠️ Bỏ qua xác thực Secret Key (chưa cấu hình SEPAY_WEBHOOK_SECRET)");
        }

        logger.LogInformation("Nhận webhook - referenceCode: {Ref}", request.ReferenceCode);

        try
        {
            await paymentService.ProcessWebhookAsync(request);
            return Ok(new { success = true });
        }
        catch (KeyNotFoundException ex)
        {
            logger.LogWarning("Đơn hàng không tồn tại: {Msg}", ex.Message);
            return NotFound(new { success = false, error = ex.Message });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Lỗi xử lý webhook SePay");
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    // [FIX LOG] Bổ sung ResponseCache NoStore
    // Lý do: Ngăn chặn triệt để tình trạng trình duyệt web (Chrome/Edge) và các Proxy
    // tự động lưu trữ (cache) kết quả trả về của một URL cố định khi Frontend gọi liên tục (polling).
    [HttpGet("status/{orderCode}")]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public async Task<IActionResult> CheckStatus(string orderCode)
    {
        logger.LogWarning("-----> [Frontend Polling] dang check status cho orderCode: {OrderCode}", orderCode);
        var status = await paymentService.GetBookingStatusAsync(orderCode);
        return Ok(status);
    }
}
