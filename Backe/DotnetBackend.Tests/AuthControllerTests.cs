using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WebPhimApi.Controllers;
using WebPhimApi.DTOs;
using WebPhimApi.Services;

namespace DotnetBackend.Tests;

public class AuthControllerTests
{
    private readonly Mock<AuthService> _mockAuthService;
    private readonly AuthController _authController;
    private readonly Mock<IResponseCookies> _mockCookies;

    public AuthControllerTests()
    {
        // Tạo đối tượng Mock cho hàm Service để chúng ta không cần quan tâm / không bị lệ thuộc vào DB thật nữa.
        // Chỉ quan tâm xem Controller nhận được KQ từ Service thì xử lý response HTTP thế nào. (Nguyên tắc Cô Lập - Test Isolation)
        _mockAuthService = new Mock<AuthService>(null!, null!);

        _authController = new AuthController(_mockAuthService.Object);

        // Setup giả lập (Mocking) cho HttpContext 
        // Mục đích: Xác nhận xem Cookie (Response.Cookies) có được gán (Append) vào máy người dùng chuẩn không
        var mockHttpContext = new Mock<HttpContext>();
        var mockHttpResponse = new Mock<HttpResponse>();
        _mockCookies = new Mock<IResponseCookies>();

        mockHttpResponse.Setup(r => r.Cookies).Returns(_mockCookies.Object);
        mockHttpContext.Setup(c => c.Response).Returns(mockHttpResponse.Object);

        _authController.ControllerContext = new ControllerContext
        {
            HttpContext = mockHttpContext.Object
        };
    }

    [Fact]
    // Test Case: Quá trình thành công -> phải gửi Http 200 kèm Cookie gán sẵn JWT 
    public async Task Login_ValidRequest_ReturnsOkAndSetsCookie()
    {
        // 1. Arrange: Thay vì tính toán phức tạp, chỉ định Mock trả về kết quả Token luôn
        var request = new LoginRequest("test@example.com", "validPassword");
        var fakeToken = new AuthResponse("fake.jwt.token");
        
        _mockAuthService
            .Setup(s => s.LoginAsync(request))
            .ReturnsAsync((fakeToken, null)); // Giả lập hàm LoginAsync() Return

        // 2. Act: Kích hoạt Controller giống như API có request đến
        var result = await _authController.Login(request);

        // 3. Assert: 
        // Đảm bảo Controller phản hồi API dưới dạng HTTP 200 OK
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(fakeToken);

        // Verify: Đảm bảo Cookie phải gọi hàm Append với cấu hình (HttpOnly, Strict) ngăn ngừa chặn 100% tấn công CSRF / XSS
        _mockCookies.Verify(c => c.Append(
            "jwt",
            "fake.jwt.token",
            It.Is<CookieOptions>(opts => 
                opts.HttpOnly == true && 
                opts.SameSite == SameSiteMode.Strict)
        ), Times.Once); // Xác nhận hàm Append này phải được gọi đúng 1 lần (Times.Once)
    }

    [Fact]
    // Test Case: Sai mật khẩu / email -> Sinh lỗi Unauthorized
    public async Task Login_InvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest("wrong@example.com", "wrongPassword");
        var errorMessage = "Email hoặc mật khẩu không đúng";
        
        // Mock giả lập trả về token null + lỗi text
        _mockAuthService
            .Setup(s => s.LoginAsync(request))
            .ReturnsAsync((null, errorMessage));

        // Act
        var result = await _authController.Login(request);

        // Assert: 
        // Phải trả về ObjectResult loại Unauthorized (Http 401)
        var unauthorizedResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorizedResult.Value.Should().BeEquivalentTo(new { message = errorMessage });
        
        // Verify: Do đăng nhập sai -> Cookie KHÔNG ĐƯỢC PHÉP set! Nếu code lỗi mà vẫn set Cookie thì sai thiết kế
        _mockCookies.Verify(c => c.Append(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CookieOptions>()), Times.Never);
    }

    [Fact]
    // Mượn cơ chế ModelState để giả lập Data không đầy đủ (vd: gửi lên Email nhưng không Password)
    public async Task Login_InvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var request = new LoginRequest("", "");
        
        // Thêm lỗi giả vào bộ Controller Validation (bình thường DataAnnotations sẽ tự làm việc này khi lên luồng request qua mạng)
        _authController.ModelState.AddModelError("Email", "Email is required");

        // Act
        var result = await _authController.Login(request);

        // Assert: 
        // Trả về BadRequest (Http 400)
        result.Should().BeOfType<BadRequestObjectResult>();
        
        // Fail Fast Design: Đảm bảo Request chết ngay từ cửa vào và Service `LoginAsync` tuyệt đối bị chặn không được gọi xuống để tiết kiệm điện/tài nguyên hệ thống!
        _mockAuthService.Verify(s => s.LoginAsync(It.IsAny<LoginRequest>()), Times.Never);
    }

    [Fact]
    // Tương tự, đăng ký xong cũng cần set HttpOnly Cookie chứ không quăng Token mộc để client lộ ra Storage trình duyệt
    public async Task Register_ValidRequest_ReturnsOkAndSetsCookie()
    {
        // Arrange
        var request = new RegisterRequest(
            "new", 
            "new@example.com", 
            "pw",
            "New User Name",
            null
        );
        var fakeToken = new AuthResponse("registered.jwt.token");

        // Setup hàm Moq chạy
        _mockAuthService
            .Setup(s => s.RegisterAsync(request))
            .ReturnsAsync((fakeToken, null));

        // Act
        var result = await _authController.Register(request);

        // Assert (Http 200 OK)
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(fakeToken);

        // Cookie HttpOnly & Strict SameSite kiểm duyệt chặt chẽ như Login
        _mockCookies.Verify(c => c.Append(
            "jwt",
            "registered.jwt.token",
            It.Is<CookieOptions>(opts => opts.HttpOnly == true && opts.SameSite == SameSiteMode.Strict)
        ), Times.Once);
    }
}
