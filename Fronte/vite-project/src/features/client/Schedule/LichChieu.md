# Tài liệu Module Lịch Chiếu (Schedule)

> **Module**: Schedule (`LichChieu`)  
> **Mục đích**: Hiển thị lịch chiếu phim được tổ chức theo các tab ngày.  
> **Đường dẫn**: `src/features/client/Schedule/`

---

## 1. Tổng quan
Module `LichChieu` là một tính năng hoàn chỉnh chịu trách nhiệm hiển thị lịch chiếu phim. Module này tuân theo mô hình **Container-Presentation** (Container - Hiển thị), trong đó component chính `LichChieu.jsx` quản lý state (trạng thái) và điều phối dữ liệu, trong khi các components con nhỏ hơn chịu trách nhiệm hiển thị giao diện cụ thể.

Thiết kế này cho phép bạn:
- **Thêm thuộc tính mới cho phim** mà không làm vỡ giao diện.
- **Thêm các tab/ngày mới** mà không cần thay đổi logic của component.
- **Chuyển sang dùng dữ liệu API** chỉ bằng cách sửa đổi container cha.

---

## 2. Cấu trúc File

```text
Schedule/
├── components/          # Các components con có thể tái sử dụng
│   ├── DateSelector.jsx # Xử lý các tab ngày (Ngày 1, Ngày 2,...)
│   ├── MovieItem.jsx    # Hiển thị chi tiết một bộ phim & các suất chiếu
│   └── NoteSection.jsx  # Hiển thị phần ghi chú/thông báo
├── LichChieu.css        # Styles riêng cho module này
├── LichChieu.jsx        # Container chính (Chứa State & Nguồn dữ liệu)
└── LichChieu.md         # File tài liệu này
```

---

## 3. Mô hình Dữ liệu (Data Models)
Để thêm nội dung mới, hãy tuân theo các JSON schema dưới đây.

### 3.1. Đối tượng Ngày/Tab (`days`)
Được sử dụng trong `LichChieu.jsx` để tạo ra các tab.

```json
{
  "id": "unique-tab-id",       // ID duy nhất cho logic nội bộ (bắt buộc)
  "dayNumber": "DD",           // Số ngày hiển thị lớn (ví dụ: "14")
  "monthYear": "/MM - Day"     // Phần đuôi hiển thị (ví dụ: "/02 - Thứ 2")
}
```

### 3.2. Đối tượng Phim (`movies`)
Được sử dụng để đổ dữ liệu cho component `MovieItem`.

```json
{
  "id": 1,                     // ID duy nhất
  "title": "Tên Phim",         // Tên hiển thị
  "imageUrl": "/path/to/img",  // Ảnh poster
  "ratingUrl": "/path/to/icon",// Icon phân loại (P, C13, C18)
  "link": "/movie-detail",     // Đường dẫn khi click vào
  "genre": "Hành động, Drama", // Chuỗi text thể loại
  "duration": "120",           // Thời lượng phút (số hoặc chuỗi)
  "type": "2D/3D",             // Loại hình chiếu
  "showtimes": [               // Mảng các suất chiếu
    {
      "time": "19:00",         // Giờ chiếu (hiển thị chính)
      "date": "14/02",         // Ngày chiếu (hiển thị nhỏ)
      "seats": "50"            // Số ghế trống
    }
  ]
}
```

---

## 4. Kiến trúc Component

### `LichChieu.jsx` (Container)
- **Vai trò**: Điểm bắt đầu. Quản lý state `activeTab` và giữ dữ liệu (`days`, `movies`).
- **Logic**: Dùng vòng lặp `map` qua mảng `days` để tạo các tab và phần nội dung tương ứng.
- **Tùy biến**: 
  - Cập nhật mảng `days` để thay đổi các tab ngày.
  - Cập nhật mảng `movies` để thay đổi nội dung phim.
  - Trong thực tế: Thay thế các mảng dữ liệu giả bằng các gọi hàm `fetch` trong `useEffect`.

### `DateSelector.jsx` (Giao diện)
- **Props**: `{ days, activeTab, onTabChange }`
- **Vai trò**: Render thanh điều hướng (navigation bar). Là pure component (không có state riêng).

### `MovieItem.jsx` (Giao diện)
- **Props**: `{ movie }`
- **Vai trò**: Render một hàng thông tin phim. Xử lý bố cục cho poster, thông tin phim, và các nút suất chiếu.
- **Styling**: Phụ thuộc vào các class `.product-item`, `.col-xxx` từ file css.

---

## 5. Hướng dẫn Mở rộng (How-To)

### ✅ Cách thêm một Ngày mới
1. Mở file `LichChieu.jsx`.
2. Tìm hằng số `days`.
3. Thêm một object mới vào mảng:
   ```javascript
   { id: 'tab-id-3', dayNumber: '15', monthYear: '/02 - Thứ 3' },
   ```
   *Không cần thay đổi dòng code nào khác.*

### ✅ Cách thêm một Phim mới
1. Mở file `LichChieu.jsx`.
2. Tìm hằng số `movies`.
3. Thêm một object mới tuân theo **Mô hình Dữ liệu (Movie Object)** ở trên.

### ✅ Cách kết nối với API
1. Xóa các mảng tĩnh `days` và `movies` trong `LichChieu.jsx`.
2. Thêm `useState` để chứa dữ liệu:
   ```javascript
   const [movies, setMovies] = useState([]);
   const [days, setDays] = useState([]);
   ```
3. Fetch dữ liệu trong `useEffect` và format nó khớp với Schemas ở Mục 3.
4. Truyền các biến state vào component con như cũ.

### ✅ Cách thêm một Trường mới (Ví dụ: Đạo diễn)
1. **Cập nhật Dữ liệu**: Thêm `director: 'Tên Đạo diễn'` vào object `movies` trong `LichChieu.jsx`.
2. **Cập nhật Giao diện**: Mở file `components/MovieItem.jsx`.
   - Destructure `director` từ props: `const { ..., director } = movie;`
   - Thêm JSX để hiển thị nó: `<li>Đạo diễn: {director}</li>` vào bên trong danh sách `.blog-info`.

---

## 6. Styling (Giao diện)
Các styles được định nghĩa trong `LichChieu.css`.
- **Hệ thống Grid**: Sử dụng hệ thống grid 16-cột tùy chỉnh (`.col-xs-16`).
- **Tabs**: Style tùy chỉnh cho tab `.tab-style-1`.
- **Responsive**: Các `@media` queries xử lý việc thay đổi bố cục trên các màn hình khác nhau.

> **Lưu ý**: Để thay đổi màu sắc toàn cục, hãy sửa các biến CSS hoặc sửa trực tiếp trong `LichChieu.css` (ví dụ: `.nav-tabs>li.active>a` để sửa màu tab đang chọn).
