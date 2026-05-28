using System;

namespace WebPhimApi.Helpers
{
    /// <summary>
    /// Lớp hỗ trợ xử lý đường dẫn URL cho ảnh.
    /// </summary>
    public static class UrlHelper
    {
        /// <summary>
        /// Chuyển đổi các URL tuyệt đối thuộc server thành đường dẫn tương đối (ví dụ: /uploads/abc.jpg).
        /// Các URL bên ngoài (như TMDB) được giữ nguyên.
        /// </summary>
        /// <param name="url">Đường dẫn ảnh cần xử lý</param>
        /// <returns>Đường dẫn tương đối hoặc giữ nguyên nếu là URL ngoài</returns>
        public static string? MakeRelativePath(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return url;

            if (Uri.TryCreate(url, UriKind.Absolute, out var uri))
            {
                var host = uri.Host.ToLower();
                
                // Nếu URL trỏ đến tên miền cục bộ hoặc tên miền sản xuất của chúng ta
                if (host == "localhost" || host == "127.0.0.1" || host == "www.dxhiep.id.vn" || host == "dxhiep.id.vn")
                {
                    return uri.PathAndQuery;
                }

                // Tự động nhận diện host từ biến môi trường FRONTEND_URL để hỗ trợ laptop khác
                var envFrontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
                if (!string.IsNullOrWhiteSpace(envFrontendUrl) && Uri.TryCreate(envFrontendUrl, UriKind.Absolute, out var frontendUri))
                {
                    if (host == frontendUri.Host.ToLower())
                    {
                        return uri.PathAndQuery;
                    }
                }
            }

            return url;
        }
    }
}
