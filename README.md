#  Đảo Bình Yên

## Bảng phân công công việc

| Họ và tên | MSSV | Đóng góp |
|---|---|---|
| Tạ Đức Long | 24521013 | 25% |
| Trần Thành Luân | 24521031 | 25% |
| Lâm Quang Minh | 24521057 | 25% |
| Tống Khí Đức Anh | 24520127 | 25% |

> *Một hòn đảo ảo nơi bạn chăm sóc tinh thần mỗi ngày.*

**Đảo Bình Yên** là ứng dụng web tương tác hướng đến sức khỏe tinh thần, kết hợp cơ chế gamification để khuyến khích người dùng ghi nhận cảm xúc và quay lại mỗi ngày. Thay vì một bảng chức năng thông thường, người dùng được đặt chân lên một hòn đảo ảo với nhiều khu vực khác nhau — mỗi khu vực mang một trải nghiệm riêng biệt.

---

##  Các khu vực trên đảo

| Khu vực | Vai trò |
|---|---|
|  **Trang chủ đảo** | Bản đồ điều hướng trung tâm |
|  **Khảo sát** | Ghi nhận trạng thái tinh thần ban đầu |
|  **Daily Check-in** | Cập nhật cảm xúc và streak mỗi ngày |
|  **Thần Thụ** | Nhận phần thưởng nhanh và gửi thư tương lai |
|  **Vườn Hoa** | Trồng cây, chuyển hạt giống thành tinh hoa |
|  **Trại Thú Cưng** | Chăm sóc thú cưng theo vòng lặp dài hạn |
|  **Nhà Gỗ** | Thư giãn bằng âm nhạc |
|  **Hải Đăng** | Tập trung, quản lý mục tiêu, radio chữa lành |
|  **Suối Nguồn** | Tâm sự, nhật ký, chat và video chữa lành |
|  **Hồ Nước** | Nhận diện cảm xúc qua camera bằng AI |

---

##  Tính năng nổi bật

- **Gamification toàn hệ thống** — vàng, hạt giống, lá, tinh hoa, pet, streak tích lũy theo hoạt động hàng ngày.
- **Nhận diện biểu cảm bằng AI** — dùng `face-api.js` để phân tích cảm xúc qua camera.
- **Chat với người lạ** — ghép cặp theo điểm cảm xúc, hỗ trợ realtime.
- **Chat bot chữa lành** — tích hợp Gemini với system prompt chuyên biệt.
- **Thư tương lai** — viết thư hôm nay, nhận lại sau 24 giờ.
- **Daily Check-in + Survey** — theo dõi 3 chủ đề: học tập, cảm xúc, giấc ngủ.
- **Đa dạng media** — video nền, âm thanh, radio stream, video chữa lành từ Cloudflare R2.

---

##  Công nghệ sử dụng

### Frontend
- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/) — animation
- [Three.js](https://threejs.org/) — hiệu ứng 3D
- [Lucide React](https://lucide.dev/) — icon
- [Zustand](https://zustand-demo.pmnd.rs/) — state management
- [Howler.js](https://howlerjs.com/) — quản lý âm thanh

### Backend & Dịch vụ
- [Firebase Auth](https://firebase.google.com/products/auth) — xác thực người dùng
- [Firestore](https://firebase.google.com/products/firestore) — cơ sở dữ liệu realtime
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) — quản lý server-side
- [Google Gemini](https://ai.google.dev/) — chat bot AI
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) + [Cloudflare R2](https://developers.cloudflare.com/r2/) — lưu trữ audio/video
- [face-api.js](https://github.com/justadudewhohacks/face-api.js) — nhận diện biểu cảm
- [Nodemailer](https://nodemailer.com/) — gửi email xác thực

---

##  Cấu trúc dự án

```
project_daobinhyen/
└── src/
    └── app/
        ├── layout.tsx
        ├── page.tsx
        ├── globals.css
        ├── home.module.css
        ├── favicon.ico
        ├── proxy.ts
        ├── context/
        │   └── AuthContext.tsx
        ├── components/
        ├── lib/
        ├── api/
        │   ├── auth/
        │   ├── bot-chat/
        │   ├── chat/
        │   ├── diary/
        │   ├── garden/
        │   ├── gemini-chat/
        │   ├── get-random-video/
        │   ├── get-videos-list/
        │   ├── match/
        │   ├── pets/
        │   ├── quotes/
        │   ├── send/
        │   ├── shop/
        │   ├── updateEssence/
        │   ├── user/
        │   └── wish/
        ├── daily-checkin/
        ├── forgot-password/
        ├── haidang/
        ├── homepage/
        ├── honuoc/
        ├── login/
        ├── nhago/
        ├── register/
        ├── suoinguon/
        ├── survey/
        ├── thanthu/
        ├── thucung/
        └── vuonhoa/
```

---

##  Luồng hoạt động

### Người dùng mới

```
/ (Landing) → /register → Xác minh email → /login
→ /survey (đặt tên + khảo sát ban đầu) → /homepage → Khám phá đảo
```

### Người dùng quay lại

```
/login → /daily-checkin (check-in cảm xúc hôm nay)
→ /homepage → Các khu vực tương tác → Nhận tài nguyên
```

### Vòng lặp gamification

```
Survey & Check-in → Điểm cảm xúc + Streak
→ Hoạt động trên đảo → Hạt giống / Vàng / Lá / Tinh hoa
→ Trồng cây → Tinh hoa → Mua thú cưng → Chăm sóc pet
→ ProfileBar & Shop phản ánh tài nguyên hiện tại
```

---

##  Cài đặt & Chạy

### Yêu cầu

- Node.js >= 18
- Tài khoản Firebase (Auth + Firestore)
- Tài khoản Cloudflare R2 (lưu trữ media)
- Google Gemini API key

### Cài đặt

```bash
# Clone repository
git clone https://github.com/ddlongggg/NT208_DaoBinhYen
cd daobinhyen/project_daobinhyen

# Cài đặt dependencies
npm install
```

### Cấu hình biến môi trường

Tạo file `.env.local` trong thư mục `project_daobinhyen/`:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Google Gemini
GEMINI_API_KEY=

# Email (Nodemailer)
GMAIL_USER=
GMAIL_PASS=

# Cloudflare R2 (AWS SDK)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_BUCKET_NAME=
```

### Chạy development

```bash
npm run dev
```

Ứng dụng chạy tại `http://localhost:3000`.

### Build production

```bash
npm run build
npm start
```

---

##  Bảo vệ route

Middleware (`proxy.ts`) kiểm soát quyền truy cập dựa trên cookie phiên đăng nhập:

| Trạng thái | Cookie `onboarding_step` | Điều hướng |
|---|---|---|
| Chưa đăng nhập | — | → `/login` |
| Đã đăng nhập, chưa có tên/survey | `survey` | → `/survey` |
| Đã survey, chưa check-in hôm nay | `daily` | → `/daily-checkin` |
| Đã hoàn tất | `done` | Vào đảo tự do |

---

##  Lưu ý kỹ thuật

- Một số API (`updateMoney`, `updateSeeds`, `garden/save`) hiện nhận `userId` từ client body. Nên verify session và dùng `uid` từ decoded token thay vì tin dữ liệu client gửi.
- Thời gian giao thư trong mailbox hiện để 5 giây (chế độ test). Cần cập nhật thành 24 giờ trước khi triển khai thật.
- Default plots: `AuthContext` khởi tạo 3 ô, API `garden/get` mặc định 6 ô — cần đồng bộ lại.
- Route `/vachda` có click zone trên homepage nhưng chưa có page tương ứng — nên ẩn hoặc đánh dấu "đang phát triển".
- Đảm bảo tất cả file được lưu UTF-8 để hiển thị tiếng Việt đúng trên GitHub.

---

##  Giấy phép

Dự án được phát triển cho mục đích học thuật.

---

<div align="center">
  <h1>🚀 <b>Chúng em đã biết làm web và hiểu hệ thống web hoạt động như thế nào.</b> 🚀</h1>
</div>
