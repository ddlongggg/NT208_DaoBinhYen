# Ý Tưởng Thiết Kế Module "Tầng Số Chữa Lành" (Tầng 2 Hải Đăng)

Dựa trên ý tưởng một không gian học tập tĩnh lặng trên ngọn hải đăng cùng chiếc đồng hồ cát, đây là concept thiết kế **"Âm Hưởng Hải Đăng"** dành cho module phát nhạc của bạn. Giao diện tập trung vào sự ấm cúng, tương tác trực quan và hiệu ứng thị giác (visual effects) đồng bộ với âm thanh.

![Lighthouse Music Room Concept](C:\Users\Lenovo\.gemini\antigravity-ide\brain\9f5b0ced-b340-48b3-aca2-6020f8656d95\lighthouse_music_room_1779382610119.png)

---

## 1. Bố Cục Giao Diện (Layout)

*   **Background (Bối cảnh):** Không gian tầng 2 của hải đăng. Bối cảnh nên là một góc phòng ấm áp, có cửa sổ hình vòm nhìn ra bầu trời (có thể thay đổi ngày/đêm theo thời gian thực) và một chút ánh sáng dịu nhẹ hắt vào.
*   **Centerpiece (Trung tâm):** Một chiếc máy phát đĩa than (Vinyl Record Player) phong cách cổ điển pha chút hiện đại (ví dụ: mâm xoay làm bằng gỗ, nhưng kim đọc đĩa phát ra ánh sáng neon nhẹ). Nó được đặt cạnh chiếc **đồng hồ cát** của bạn.
*   **Record Collection (Kệ đĩa nhạc):** Thay vì làm một list danh sách bài hát nhàm chán, hãy thiết kế một chiếc kệ gỗ nhỏ hoặc một giá đỡ chứa các đĩa than lộ ra một nửa. Người dùng có thể lướt qua (carousel) để chọn đĩa.

## 2. Phân Loại Đĩa Màu & Tần Số (Color & Frequency Mapping)

Mỗi chiếc đĩa sẽ có một màu sắc đặc trưng đại diện cho một loại sóng não (tần số chữa lành) và âm thanh môi trường đi kèm. 

> [!TIP]
> **Hiệu ứng ánh sáng toàn căn phòng (Ambience Sync):** Điểm nhấn chính của thiết kế là khi một đĩa nhạc được phát, **toàn bộ ánh sáng của tầng 2 sẽ chuyển màu dịu nhẹ** khớp với màu của đĩa đó, tạo ra không gian nhập vai (immersive) tuyệt đối.

*   **🔵 Đĩa Xanh Dương (Ocean Focus - Sóng Theta):** 
    *   *Âm thanh:* Tiếng sóng vỗ vào vách đá ngọn hải đăng, tiếng nước róc rách, tiếng cá voi kêu vọng từ xa.
    *   *Ánh sáng phòng:* Chuyển sang tone màu xanh biển sâu, mát mẻ, giúp dập tắt sự xao nhãng. Tốt cho việc tập trung giải quyết bài tập khó.
*   **🟢 Đĩa Xanh Lá (Forest Whisper - Sóng Alpha):** 
    *   *Âm thanh:* Tiếng lá xào xạc trong gió, tiếng chim hót, tiếng suối chảy.
    *   *Ánh sáng phòng:* Tone màu xanh lục bích của rừng cây rọi vào. Mang lại cảm giác thư giãn, giảm căng thẳng (stress relief) khi học.
*   **⚪ Đĩa Trắng/Xám Bạc (Rainy Mood - White Noise):** 
    *   *Âm thanh:* Tiếng mưa rào rả rích trên mái che hải đăng, thỉnh thoảng có tiếng sấm sét trầm đằng xa, tiếng gió rít nhẹ ngoài cửa sổ. 
    *   *Ánh sáng phòng:* Căn phòng tối đi một chút, ánh sáng xám nhạt, tạo cảm giác an toàn và cô lập hoàn toàn với thế giới bên ngoài.
*   **🟠 Đĩa Cam/Nâu Đồng (Cozy Fireplace - Lo-Fi/Beta):** 
    *   *Âm thanh:* Tiếng củi lách tách trong lò sưởi, tiếng lật trang sách sột soạt, nhạc Lo-fi hoặc Jazz nhẹ nhàng.
    *   *Ánh sáng phòng:* Ánh sáng vàng cam ấm áp như ngọn lửa. Thích hợp cho những buổi tối ngồi đọc sách hoặc học bài thong thả.

## 3. Tương Tác Của Người Dùng (Interactions)

*   **Kéo và Thả (Drag & Drop):** Để bật nhạc, người dùng sẽ dùng chuột (hoặc ngón tay trên mobile) **kéo** chiếc đĩa từ kệ và **thả** vào máy phát. Cần trục (tonearm) sẽ tự động di chuyển vào và đĩa bắt đầu xoay.
*   **Mixer "Pha Trộn" (Ambient Mixer):** Dưới chân máy phát đĩa, thiết kế thêm 3-4 thanh trượt (slider) nhỏ kiểu cổ điển. Dù đang nghe đĩa nào, người dùng vẫn có thể kéo các thanh này lên để pha thêm tiếng nền (Ví dụ: Đang nghe đĩa Lo-Fi nhưng muốn mix thêm 30% tiếng Mưa và 10% tiếng Gió lùa qua khe cửa).
*   **Đồng Bộ Đồng Hồ Cát:**
    *   Khi lật đồng hồ cát bắt đầu phiên học, đĩa nhạc sẽ tự động từ từ *fade in* (lớn dần). 
    *   Trong quá trình học, đĩa xoay đều và tỏa ra các hạt bụi sáng li ti (particle effects) mang màu sắc của đĩa đó bay lơ lửng quanh tầng 2.
    *   Khi đồng hồ cát chảy hết, nhạc sẽ *fade out* chậm lại và tiếng "Ting" nhẹ vang lên báo hiệu giờ nghỉ, đĩa từ từ ngừng quay.

## 4. Các Ý Tưởng Thêm Để Giao Diện Sống Động Hơn

*   **Thời tiết ở cửa sổ (Window Weather):** Nếu cửa sổ hải đăng hiển thị trong UI, hãy cho nó đồng bộ với đĩa nhạc. Nếu đang phát Đĩa Xám (Mưa), ngoài cửa sổ sẽ có những giọt mưa đập vào kính.
*   **Thành tựu (Unlockables):** Ban đầu người dùng chỉ có 1-2 đĩa cơ bản. Khi tích lũy đủ số giờ học từ đồng hồ cát, họ sẽ được tặng thêm những chiếc đĩa có màu hiếm (như Đĩa Tím - Sóng Gamma cho sự sáng tạo, hay Đĩa Hologram). Điều này tăng tính gamification (game hóa) cho ứng dụng của bạn.
