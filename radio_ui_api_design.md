# Thiết Kế UI/UX 2D & API Cho Máy Phát Nhạc (Radio Tầng 2)

Dựa trên hình ảnh không gian hải đăng với chiếc Radio cổ điển tuyệt đẹp mà bạn cung cấp, đây là bản thiết kế lại tập trung hoàn toàn vào **giao diện 2D** khi người dùng nhấp vào máy phát nhạc, kèm theo **thiết kế API** để lấy nhạc từ Cloud.

---

## 1. Giao Diện 2D (Overlay Modal)

Khi người dùng click vào dòng chữ "Tần số chữa lành" hoặc nhấp vào chiếc radio, màn hình sẽ không chuyển trang mà một **giao diện 2D (Modal/Overlay)** sẽ hiện ra phủ lên trên.

**Phong cách thiết kế:** 
*   **Glassmorphism (Kính mờ):** Nền của Modal nên là dạng kính mờ (backdrop-filter: blur) hơi ngả tối, giúp người dùng vẫn nhìn thấy mờ mờ khung cảnh hải đăng ấm áp và chiếc radio phía sau.
*   **Bố cục (Layout):** Chia làm 2 cột rõ ràng.

### A. Cột Trái: Trạm Điều Khiển (The Control Station & Mixer)
Khu vực này giống như bảng điều khiển của một Amply chuyên nghiệp nhưng được thiết kế tối giản, dễ hiểu.

*   **Now Playing (Đang phát):**
    *   **Visual:** Hiển thị hình ảnh một đĩa than (Vinyl) đang xoay tròn hoặc ảnh bìa (Cover art) vuông vức.
    *   **Info:** Tên bản nhạc / Tần số đang phát (Font chữ to, rõ ràng, mang hơi hướng hoài cổ như Serif).
    *   **Controls:** Nút Play/Pause lớn ở giữa, Next/Prev ở hai bên. Một thanh timeline nhỏ để tua nhạc.
*   **Ambient Mixer (Bộ Trộn Âm Thanh Môi Trường):** Đây là tính năng "ăn tiền" nhất.
    *   Bên dưới phần Now Playing là một bộ 4-5 thanh trượt dọc (Vertical Sliders). 
    *   Mỗi thanh có một Icon đại diện: 🌧️ (Mưa), 🌊 (Sóng biển), 🔥 (Lửa trại), 🍃 (Gió rừng), ☕ (Quán Cafe).
    *   **Hoạt động:** Dù bạn đang nghe một đĩa nhạc Lo-Fi hay tần số Theta, bạn đều có thể kéo các thanh trượt này lên để *pha trộn (mix)* thêm tiếng mưa hay tiếng củi lách tách vào làm nền, tạo ra không gian riêng của mình.

### B. Cột Phải: Thư Viện Đĩa Nhạc (The Library)
Nơi hiển thị toàn bộ các đĩa nhạc và tần số được gọi từ Cloud về.

*   **Thanh Phân Loại (Tabs Navigation):** 
    *   Nằm trên cùng, gồm các nút tab để chuyển qua lại: `Tất cả` | `Tần số (Frequencies)` | `Nhạc (Music)` | `Môi trường (Ambience)`.
*   **Lưới Hiển Thị (Grid View):**
    *   Các bài nhạc được trình bày dưới dạng một **lưới các ô vuông** (giống kệ đĩa CD/Đĩa than).
    *   Mỗi ô sẽ có hình ảnh bìa mờ ảo, màu sắc chủ đạo riêng (Xanh dương cho tĩnh tâm, Cam cho tập trung...).
    *   **Hiệu ứng (Hover Effect):** Khi rê chuột vào một ô, ô đó sẽ hơi phóng to (scale up) nhẹ nhàng, màu sắc rực rỡ hơn và hiện lên nút Play ▶️ ở chính giữa.

---

## 2. Thiết Kế API (Tích hợp Cloud)

Vì file âm thanh khá nặng, chúng ta lưu trữ trên Cloud (như AWS S3, Cloudinary, Firebase Storage) và chỉ lưu **đường dẫn URL** trong Database. Dưới đây là thiết kế API cơ bản để frontend gọi xuống.

### A. Cấu trúc Dữ Liệu (JSON Model)
Mỗi bản nhạc/tần số trong database sẽ có cấu trúc:
```json
{
  "id": "trk_001",
  "title": "Alpha Focus (14Hz)",
  "type": "frequency", // Phân loại: 'music', 'frequency', 'ambient'
  "coverUrl": "https://your-cloud.com/images/alpha-cover.png",
  "audioUrl": "https://your-cloud.com/audio/alpha-14hz.mp3",
  "colorTheme": "#4CAF50", // Để Frontend đổi màu UI hoặc ánh sáng phòng
  "isLoop": true // Các tần số và tiếng mưa thì cần lặp lại vô hạn
}
```

### B. Các Endpoint API Cần Thiết

**1. Lấy danh sách Nhạc/Tần số theo Tab (Bộ lọc)**
*   **Endpoint:** `GET /api/v1/audio/tracks`
*   **Query Params:** `?type=music` hoặc `?type=frequency`
*   **Mục đích:** Khi người dùng bấm vào Tab "Nhạc" ở cột phải, frontend gọi API này để lấy danh sách đĩa nhạc hiển thị vào lưới Grid.
*   **Response mẫu:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "mus_01",
      "title": "Midnight Lo-Fi",
      "coverUrl": "https://.../lofi.jpg",
      "audioUrl": "https://.../lofi.mp3",
      "type": "music"
    },
    // ...
  ]
}
```

**2. Lấy danh sách Âm thanh cho Mixer (Bộ trộn)**
*   **Endpoint:** `GET /api/v1/audio/ambience`
*   **Mục đích:** Gọi ngay khi vừa bật modal 2D lên. Load danh sách 4-5 âm thanh nền (mưa, lửa, gió). Frontend sẽ tải ngầm các âm thanh này sẵn nhưng để âm lượng ở mức 0. Khi người dùng kéo thanh trượt Slider ở cột trái, frontend chỉ việc tăng Volume lên.
*   **Response mẫu:**
```json
{
  "status": "success",
  "data": [
    { "id": "amb_01", "title": "Mưa rào", "icon": "rain", "audioUrl": "..." },
    { "id": "amb_02", "title": "Sóng biển", "icon": "ocean", "audioUrl": "..." }
  ]
}
```

### C. Gợi ý Kỹ thuật Frontend (Dành cho sau này)
Khi bạn bắt đầu code phần này, bạn không nên dùng thẻ `<audio>` mặc định của HTML vì nó khó làm chức năng Mixer (trộn nhiều âm thanh cùng lúc). 
👉 **Gợi ý:** Hãy sử dụng thư viện **[Howler.js](https://howlerjs.com/)**. Nó cực kỳ mạnh mẽ trong việc kiểm soát âm lượng từng track riêng lẻ, hỗ trợ vòng lặp (loop) mượt mà không bị khựng, và tự động load nhạc từ URL cloud rất tối ưu.
