using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using WebPhimApi.Controllers;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace DotnetBackend.Tests;

public class PaymentControllerTests
{
    private readonly Mock<PaymentService> _mockPaymentService;
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly Mock<ILogger<PaymentController>> _mockLogger;
    private readonly PaymentController _controller;

    public PaymentControllerTests()
    {
        // 1. Arrange: Setup Mock cho các dependencies của Controller
        // Bắt buộc phải khởi tạo đối tượng PaymentService với (null, null, null) rồi Mock đè lên. 
        // Do DB và Redis không cần thiết ở level Controller (đã được bóp lại nhờ _mockPaymentService)
        _mockPaymentService = new Mock<PaymentService>(null!, null!, null!);
        
        // 2. Mock Configuration để giả lập Environment Variables (SEPAY_WEBHOOK_SECRET)
        // Set cứng mã khóa là "MySecretToken123" để test kiểm soát truy cập
        _mockConfig = new Mock<IConfiguration>();
        _mockConfig.Setup(c => c["SepayWebhookSecret"]).Returns("MySecretToken123");
        
        _mockLogger = new Mock<ILogger<PaymentController>>();

        _controller = new PaymentController(_mockPaymentService.Object, _mockConfig.Object, _mockLogger.Object);
        
        // Buộc hệ thống đọc secret từ _mockConfig thay vì biến môi trường Environment.GetEnvironmentVariable("SEPAY_WEBHOOK_SECRET")
        Environment.SetEnvironmentVariable("SEPAY_WEBHOOK_SECRET", null);
    }

    [Fact]
    // Tình huống 1: Webhook gửi dữ liệu hợp chuẩn và mang theo Token (Authorization) chính xác
    public async Task HandleWebhook_ValidTokenAndValidOrder_ReturnsOk()
    {
        // ── 1. Chuẩn bị (Arrange) ──
        var request = new SePayWebhookRequest(1, "SEPAY", "2023-01-01", "123", 100000, "Thanh toan don DH1", "REF1");

        // Đảm bảo không ném lỗi gì nghĩa là ProcessWebhookAsync thành công trơn tru
        _mockPaymentService.Setup(s => s.ProcessWebhookAsync(request)).Returns(Task.CompletedTask);

        // ── 2. Thực thi (Act) ──
        // Nhớ mớm token đúng chứa "MySecretToken123" vào Parameter đầu tiên giống như 1 Header thực tế
        var result = await _controller.HandleWebhook("Apikey MySecretToken123", request);

        // ── 3. Kiểm chứng (Assert) ──
        result.Should().BeOfType<OkObjectResult>();
        var okResult = (OkObjectResult)result;
        okResult.StatusCode.Should().Be(200);

        // Verify: Chắc chắn rằng hàm gốc `ProcessWebhookAsync` của service đã ĐƯỢC CHẠM TỚI 1 lần
        _mockPaymentService.Verify(s => s.ProcessWebhookAsync(It.IsAny<SePayWebhookRequest>()), Times.Once);
    }

    [Fact]
    // Tình huống 2: Người lạ, Hacker cố tình đẩy webhook rác vào với Token sai
    public async Task HandleWebhook_InvalidToken_ReturnsUnauthorized()
    {
        // ── 1. Chuẩn bị (Arrange) ──
        var request = new SePayWebhookRequest(2, "SEPAY", "2023-01-01", "123", 100000, "Thanh toan don DH2", "REF2");

        // ── 2. Thực thi (Act) ──
        // Đưa cho nó một token tào lao (Sai)
        var result = await _controller.HandleWebhook("Apikey WRONG_TOKEN", request);

        // ── 3. Kiểm chứng (Assert) ──
        // Kết quả bị chặn ngay ở cửa: Trả về HTTP 401 Unauthorized
        result.Should().BeOfType<UnauthorizedObjectResult>();
        var unauthResult = (UnauthorizedObjectResult)result;
        unauthResult.StatusCode.Should().Be(401);

        // Verify "Short-Circuit" (Bẻ khóa sớm): Đảm bảo tuyệt đối KHÔNG có tiến trình nào xâm nhập vào Service Database!
        _mockPaymentService.Verify(s => s.ProcessWebhookAsync(It.IsAny<SePayWebhookRequest>()), Times.Never);
    }

    [Fact]
    // Tình huống 3: Webhook gọi đúng token, cơ mà truyền nội dung chuyển khoản sai (Không thấy Đơn hàng tương ứng trên DB)
    public async Task HandleWebhook_ValidTokenButOrderNotFound_ReturnsNotFound()
    {
        // ── 1. Chuẩn bị (Arrange) ──
        var request = new SePayWebhookRequest(3, "SEPAY", "2023-01-01", "123", 100000, "Thanh toan DH_HACKED", "REF3");

        // Giả lập Database đã lùng sùng và Service hét lên: Không có đơn hàng nào cả
        _mockPaymentService.Setup(s => s.ProcessWebhookAsync(request))
                           .ThrowsAsync(new KeyNotFoundException("Không tìm thấy đơn hàng chứa mã DH_HACKED"));

        // ── 2. Thực thi (Act) ──
        var result = await _controller.HandleWebhook("Apikey MySecretToken123", request);

        // ── 3. Kiểm chứng (Assert) ──
        // Controller phải nhạy bén bắt được `KeyNotFoundException` và convert nó thành HTTP 404 (NotFound)
        result.Should().BeOfType<NotFoundObjectResult>();
        var notFoundResult = (NotFoundObjectResult)result;
        notFoundResult.StatusCode.Should().Be(404);
        
        // Thử check nội dung lỗi trả về có chữ "Không tìm thấy"
        notFoundResult.Value?.ToString().Should().Contain("Không tìm thấy đơn hàng");
    }
}
