using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace WebPhimApi.DTOs;

public record LoginRequest(
    [Required(ErrorMessage = "Email không được để trống")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    string Email,
    [Required(ErrorMessage = "Mật khẩu không được để trống")]
    string Password
);

public record RegisterRequest(
    [Required][MinLength(3)][MaxLength(50)] string Username,
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    [Required] string FullName,
    string? PhoneNumber
);

public record AuthResponse(
    string AccessToken,
    string TokenType = "Bearer",
    long ExpiresIn = 604800
);

public record UserInfoResponse(
    [property: JsonPropertyName("id")] int UserId,
    string Username,
    string Email,
    string? FullName,
    string? PhoneNumber,
    string Role,
    int Points,
    string? AvatarUrl
);

public record UpdateProfileRequest(
    [Required] string FullName,
    string? PhoneNumber,
    string? AvatarUrl
);

public record ForgotPasswordRequest(
    [Required(ErrorMessage = "Email không được để trống")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    string Email
);

public record ResetPasswordRequest(
    [Required(ErrorMessage = "Token không được để trống")]
    string Token,
    [Required(ErrorMessage = "Mật khẩu mới không được để trống")]
    [MinLength(6, ErrorMessage = "Mật khẩu phải từ 6 ký tự trở lên")]
    string NewPassword
);
