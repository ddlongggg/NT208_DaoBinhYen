# Ke hoach sua Settings va thong bao thu

## Muc tieu

- Nut cai dat hien tren tat ca cac khu/vung chinh cua app.
- Khong hien nut cai dat o cac route: `/login`, `/register`, `/survey`, `/daily-checkin`, `/forgot-password`.
- Khong hien thong bao thu trong phan hoi thoai/ong lao luc dang nhap hoac lam survey.
- Sau khi nguoi dung vao `/homepage`, neu co thu da giao chua doc thi hien thong bao co thu.
- Thong bao thu cho nguoi dung chon `Mo thu` hoac `Bo qua`.
- Neu `Bo qua` thi dong thong bao va cho nguoi dung tiep tuc/di next binh thuong.

## Huong lam du kien

1. Tao component global rieng cho nut setting, vi du `GlobalSettingsButton`.
   - Dung `usePathname()` de doc route hien tai.
   - Neu pathname nam trong danh sach loai tru thi return `null`.
   - Neu khong bi loai tru thi render `SettingsButton`.
   - Gan component nay trong `layout.tsx` de nut setting phu tat ca khu.

2. Go cac `SettingsButton` render truc tiep o nhung page da duoc global bao phu neu can.
   - Uu tien go o `/homepage` va `/thanthu` de tranh trung nut.
   - Kiem tra cac page khu khac co import/render rieng nhu `/nhago`, `/survey`, `/daily-checkin`.
   - `/survey` va `/daily-checkin` nam trong danh sach loai tru, nen khong duoc con nut setting.

3. Tao component thong bao thu tren homepage.
   - Component chi chay o client va chi dat/render trong `/homepage`.
   - Goi `/api/user/mailbox/inbox` sau khi vao homepage.
   - Loc thu `!is_read`; neu co thi hien modal/notification.
   - Nut `Mo thu`: dan toi `/thanthu` va co query/state de mo hop thu tab inbox, hoac toi `/thanthu` truoc neu chua can auto-open.
   - Nut `Bo qua`: dong modal, luu session/localStorage de khong hien lap lai lien tuc trong cung phien.

4. Neu can auto mo hop thu o `/thanthu`.
   - Cho `/thanthu` doc query `?mailbox=inbox`.
   - Khi query nay co mat, set `isMailboxModalOpen = true`, `mailTab = 'inbox'`, va fetch inbox.

## File du kien sua

- `project_daobinhyen/src/app/layout.tsx`
- `project_daobinhyen/src/app/components/GlobalSettingsButton.tsx` (file moi)
- `project_daobinhyen/src/app/homepage/page.tsx`
- `project_daobinhyen/src/app/thanthu/page.tsx` neu can auto mo hop thu
- Cac page dang render `SettingsButton` truc tiep neu gay trung nut

## Kiem tra sau khi lam

- Chay build/lint neu project co script phu hop.
- Kiem tra `git diff` de dam bao khong push/khong sua remote.
- Kiem tra route loai tru khong hien setting: `/login`, `/register`, `/survey`, `/daily-checkin`, `/forgot-password`.
- Kiem tra `/homepage` va cac khu chinh co nut setting.
- Kiem tra thong bao thu chi hien sau khi vao `/homepage`, khong hien trong login/survey.
