# Phân tích luồng hoạt động đồ án Đảo Bình Yên

## 1. Tổng quan hệ thống

**Đảo Bình Yên** là một ứng dụng web tương tác hướng đến chăm sóc tinh thần, ghi nhận cảm xúc và tạo động lực quay lại mỗi ngày bằng cơ chế gamification. Người dùng không thao tác với một bảng chức năng khô cứng, mà đi vào một hòn đảo ảo gồm nhiều khu vực: Trang chủ đảo, Khảo sát, Daily Check-in, Hải Đăng, Thần Thụ, Nhà Gỗ, Suối Nguồn, Hồ Nước, Vườn Hoa và Trại Thú Cưng.

Ứng dụng được xây dựng bằng **Next.js App Router**, **React**, **TypeScript**, **Firebase Auth**, **Firestore**, **Firebase Admin**, kết hợp các thư viện như `face-api.js`, `framer-motion`, `howler`, `lucide-react`, `zustand`, `three` và AWS SDK để lấy audio từ Cloudflare R2.

Về mặt tổ chức, code chính nằm trong:

- `project_daobinhyen/src/app`: chứa page, layout, components, context, API routes.
- `project_daobinhyen/src/app/api`: chứa các backend route xử lý xác thực, user data, survey, check-in, garden, pets, mailbox, chat, video, shop.
- `project_daobinhyen/src/app/context/AuthContext.tsx`: chứa trạng thái người dùng và dữ liệu game toàn cục.
- `project_daobinhyen/src/proxy.ts`: middleware điều hướng và bảo vệ route.

Luồng tổng thể của hệ thống có thể hiểu như sau:

1. Người dùng vào landing page `/`.
2. Người dùng đăng ký hoặc đăng nhập.
3. Server xác thực Firebase token và tạo cookie phiên đăng nhập.
4. Middleware kiểm tra trạng thái onboarding.
5. Người dùng mới phải đặt tên và làm khảo sát ban đầu.
6. Người dùng cũ phải đi qua daily check-in trước khi vào đảo.
7. Khi vào đảo, người dùng chọn từng khu vực để tương tác.
8. Mỗi khu vực đọc/ghi dữ liệu vào Firestore thông qua API route hoặc Firebase client.
9. Các tài nguyên như vàng, hạt giống, lá, tinh hoa, thú cưng và điểm trạng thái được đồng bộ lại lên thanh hồ sơ và shop toàn cục.

## 2. Kiến trúc layout toàn cục

File `src/app/layout.tsx` là layout gốc của ứng dụng. Tất cả page con được bọc trong `AuthProvider`, sau đó render các component toàn cục:

- `ProfileBar`: thanh hồ sơ người dùng.
- `ShopGlobal`: cửa hàng toàn cục.
- `PeriodicCheckin`: popup mini check-in định kỳ.
- `GlobalSettingsButton`: nút cài đặt âm lượng và đăng xuất.
- `{children}`: nội dung page hiện tại.

Điều này có nghĩa là khi người dùng đã vào các khu vực chính của đảo, gần như mọi trang đều có cùng lớp chức năng nền:

- Có thông tin tài khoản.
- Có tài nguyên hiện tại.
- Có thể mở shop.
- Có thể chỉnh âm lượng.
- Có thể bị hỏi mini check-in định kỳ.

`AuthProvider` là lớp quan trọng nhất ở client. Khi Firebase Auth báo có user, context gọi:

- `/api/user/getUserInFo` để lấy dữ liệu user.
- `/api/garden/get` để lấy dữ liệu vườn.

Sau đó context lưu:

- `user`: Firebase user hiện tại.
- `userDataExtended`: dữ liệu mở rộng của user trong Firestore.
- `plots`: danh sách ô đất trong vườn.
- `loading`: trạng thái tải dữ liệu.

Khi user đăng xuất, context xóa sạch dữ liệu trong RAM để tránh hiển thị dữ liệu cũ.

## 3. Luồng bảo vệ route và onboarding

File `src/proxy.ts` quyết định người dùng được đi đâu. Middleware kiểm tra đường dẫn hiện tại, cookie `session` và cookie `onboarding_step`.

Các route công khai gồm:

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/api/*`
- `/_next/*`

Nếu người dùng chưa có cookie `session`, mọi route ứng dụng đều bị chuyển về `/login`.

Nếu người dùng đã có session nhưng chưa có cookie `onboarding_step`, middleware chỉ cho vào `/survey` hoặc `/daily-checkin`; các route khác bị chuyển về `/survey`.

Cookie `onboarding_step` có ba trạng thái:

- `survey`: người dùng phải ở `/survey`.
- `daily`: người dùng phải ở `/daily-checkin`, trừ khi vào `/survey?topic=...` để làm khảo sát theo chủ đề bị thiếu.
- `done`: người dùng đã hoàn tất điều kiện vào đảo và được vào các route app hợp lệ.

Luồng này giúp hệ thống đảm bảo người dùng không bỏ qua các bước quan trọng. Người mới phải có tên và điểm khảo sát ban đầu. Người dùng quay lại phải check-in để cập nhật trạng thái tinh thần trước khi vào đảo.

## 4. Luồng trang mở đầu

Trang `/` nằm ở `src/app/page.tsx`. Đây là màn hình chào mừng với video nền, âm thanh và nút bắt đầu hành trình.

Luồng hoạt động:

1. Người dùng mở ứng dụng.
2. Trang phát video nền `beach2.mp4` và âm thanh `tiengchi.mp3`.
3. Người dùng bấm nút bắt đầu hành trình.
4. Client gọi `router.push('/login')`.
5. Người dùng được đưa đến trang đăng nhập.

Trang này không xử lý dữ liệu, không gọi API và không cần đăng nhập.

## 5. Luồng đăng ký tài khoản

Trang `/register` nằm ở `src/app/register/page.tsx`.

Luồng phía client:

1. Người dùng nhập email, mật khẩu, số điện thoại.
2. Client kiểm tra các trường cơ bản.
3. Client gửi request `POST /api/auth/register`.
4. Nếu thành công, UI hiển thị thông báo đã gửi email xác minh.
5. Người dùng quay lại trang login để đăng nhập sau khi xác minh email.

Luồng phía server ở `/api/auth/register`:

1. Server đọc `email`, `password`, `phone` từ body.
2. Server kiểm tra email và password có tồn tại.
3. Server kiểm tra mật khẩu bằng regex:
   - Ít nhất 8 ký tự.
   - Có chữ thường.
   - Có chữ hoa.
   - Có ký tự đặc biệt.
4. Server tạo user trong Firebase Auth.
5. Server tạo document `users/{uid}` trong Firestore bằng `createDefaultUserData`.
6. Dữ liệu mặc định gồm:
   - `uid`, `email`, `provider`, `createdAt`, `lastLogin`.
   - `username: null`.
   - `lastSurveyScore: null`.
   - `lastSurveyType: null`.
   - `topicStreak: 0`.
   - `lastCheckinDate: null`.
   - `seeds: 0`, `money: 0`, `leaves: 0`.
   - `essence_lam`, `essence_tim`, `essence_vang`, `essence_cam`.
   - `ownedPets: []`.
   - `survey_study`, `survey_emotion`, `survey_sleep`.
7. Server tạo link xác minh email bằng Firebase Admin.
8. Server gửi email xác minh qua Nodemailer/Gmail.
9. Nếu lỗi ở bước tạo link hoặc gửi email, server rollback bằng cách xóa Auth user và Firestore document.

Điểm quan trọng: hệ thống không chỉ tạo tài khoản Firebase Auth mà còn tạo sẵn toàn bộ schema user trong Firestore để các khu vực game đọc dữ liệu ổn định.

## 6. Luồng đăng nhập

Trang `/login` nằm ở `src/app/login/page.tsx`.

Ứng dụng hỗ trợ đăng nhập bằng:

- Email/password.
- Google popup.
- Facebook popup.

Luồng phía client:

1. Người dùng nhập email/password hoặc chọn social login.
2. Client gọi Firebase Auth để đăng nhập.
3. Firebase trả về user credential.
4. Client lấy `idToken`.
5. Client gửi `idToken` tới `POST /api/auth/login`.
6. Nếu server trả OK, client chuyển đến `/survey`.

Luồng phía server ở `/api/auth/login`:

1. Server nhận `idToken`.
2. Server verify token bằng Firebase Admin.
3. Nếu provider là `password` và email chưa verify, server trả lỗi 403.
4. Server kiểm tra document `users/{uid}`:
   - Nếu chưa có, tạo document user mặc định cho social login lần đầu.
   - Nếu đã có, update `lastLogin`.
5. Server tạo session cookie thời hạn 7 ngày.
6. Server set cookie `session`.
7. Server set cookie `onboarding_step` bằng `getOnboardingStep`.

Hàm `getOnboardingStep` hoạt động như sau:

- Nếu chưa có `username` hoặc chưa có survey score/type: trả `survey`.
- Nếu đã có tên và survey: trả `daily`.

Sau login, middleware sẽ tiếp tục ép user đi đúng flow dựa trên cookie này.

## 7. Luồng quên mật khẩu

Trang `/forgot-password` dùng Firebase client.

Luồng hoạt động:

1. Người dùng nhập email.
2. Client gọi `sendPasswordResetEmail(auth, email)`.
3. Firebase gửi email reset password.
4. UI hiển thị thông báo thành công hoặc lỗi.

Phần này không đi qua API route riêng của project.

## 8. Luồng đăng xuất

Nút đăng xuất nằm trong `SettingsButton`.

Luồng hoạt động:

1. Người dùng mở cài đặt.
2. Chọn đăng xuất.
3. Client gọi `POST /api/auth/logout`.
4. Server xóa cookie `session`.
5. Server xóa cookie `onboarding_step`.
6. Client có thể quay về login.

Khi Firebase Auth state mất user, `AuthContext` xóa `userDataExtended` và `plots`.

## 9. Luồng khảo sát ban đầu

Trang `/survey` là một trong những luồng quan trọng nhất của hệ thống.

Khi mở trang, component có state:

- `stage`: trạng thái màn hình hiện tại.
- `userName`: tên người dùng.
- `currentSceneId`: scene hội thoại hiện tại.
- `totalScore`: tổng điểm khảo sát.
- `selectedTopic`: chủ đề đang khảo sát.
- `isNewUser`: xác định người dùng mới hay cũ.

Luồng kiểm tra đầu vào:

1. Page gọi `/api/user/getUserInFo`.
2. Nếu API lỗi, user bị chuyển về `/login`.
3. Nếu user chưa có username:
   - `isNewUser = true`.
   - `stage = START`.
   - Hiển thị intro.
4. Nếu URL có `?topic=study|emotion|sleep`:
   - Bỏ qua intro.
   - Set topic bị ép.
   - Nhảy thẳng vào câu hỏi đầu tiên của topic.
5. Nếu đã có username nhưng chưa có survey:
   - `stage = INTRO`.
6. Nếu đã có survey:
   - Chuyển qua `/daily-checkin`.

Luồng đặt tên:

1. Người dùng nhập tên.
2. Client gọi `POST /api/user/updateusername`.
3. API verify session cookie.
4. API trim tên.
5. Kiểm tra độ dài từ 2 đến 30 ký tự.
6. Query Firestore xem tên đã bị user khác dùng chưa.
7. Nếu trùng, trả 409.
8. Nếu hợp lệ, update `username`.

Luồng trả lời khảo sát:

1. Mỗi scene có text và option.
2. Người dùng chọn option.
3. Nếu option có `weight`, cộng vào `totalScore`.
4. Nếu option dẫn đến `study_q1`, `emotion_q1`, `sleep_q1`, hệ thống lưu `selectedTopic`.
5. Khi đến scene kết quả, app sinh thông điệp theo khoảng điểm.
6. Người dùng hoàn tất khảo sát.

Luồng lưu kết quả:

1. Client gọi `POST /api/user/updateMiniSurvey` với `{ topic, newScore }`.
2. API lấy session cookie.
3. API đọc user hiện tại.
4. API lấy điểm cũ của `survey_${topic}`.
5. API tính level cũ và level mới theo công thức `Math.floor(score / 10) + 1`, tối đa 10.
6. API update:
   - `survey_${topic}`.
   - `lastSurveyScore`.
   - `lastSurveyType`.
7. Nếu level mới cao hơn level cũ và điểm tăng, API random thưởng:
   - 40% tiền.
   - 30% hạt giống.
   - 15% tinh hoa lam.
   - 10% tinh hoa tím.
   - 4% tinh hoa vàng.
   - 1% tinh hoa cam.
8. API set cookie onboarding:
   - Nếu trước đó là `survey`, set `done`.
   - Nếu trước đó đã `done`, giữ `done`.
   - Mặc định còn lại là `daily`.
9. Client lưu nhẹ `{ name, score }` vào localStorage.
10. Nếu là user mới, chuyển `/homepage`.
11. Nếu là user cũ bị ép khảo sát lại, chuyển `/daily-checkin`.

## 10. Luồng daily check-in

Trang `/daily-checkin` là bước hỏi thăm hằng ngày trước khi vào đảo.

Khi vào trang:

1. Client gọi `/api/user/getUserInFo`.
2. Nếu lỗi, chuyển `/login`.
3. Client đọc:
   - `lastLoginDate`.
   - `lastSurveyType`.
   - `lastSurveyScore`.
   - `topicStreak`.
   - `survey_study`.
   - `survey_emotion`.
   - `survey_sleep`.
   - `seeds`.
4. Client tính số ngày cách lần check-in trước.
5. Client chọn nhánh hội thoại.

Các nhánh hội thoại:

- `long_absence`: nếu vắng từ 180 ngày trở lên. Trưởng đảo yêu cầu làm lại khảo sát đầy đủ.
- `seeds_gift`: xác suất 15%, tặng 3 đến 5 hạt giống.
- `stuck`: nếu cùng một chủ đề nhiều ngày và điểm vẫn thấp.
- `medium_absence`: nếu vắng từ 30 ngày trở lên.
- `bad_emotion`: nếu lần trước là cảm xúc, điểm thấp hơn hoặc bằng 40, có xác suất 50%.
- `normal`: chào hỏi bình thường theo giờ trong ngày.

Luồng chọn vấn đề trong ngày:

1. Người dùng chọn một trong ba chủ đề:
   - Học tập.
   - Cảm xúc.
   - Giấc ngủ.
2. Client lưu `pendingChoice`.
3. Client kiểm tra user đã từng có điểm `survey_${topic}` chưa.
4. Nếu chưa từng có điểm:
   - Hiển thị lời dẫn.
   - Bấm bắt đầu khảo sát.
   - Chuyển sang `/survey?topic=...`.
5. Nếu đã có điểm:
   - App hỏi hôm nay tốt hơn hay tệ hơn.
   - Người dùng chọn mức sao.
   - App tính điểm mới.
   - Gọi `/api/user/updateMiniSurvey`.

Luồng mini survey:

1. Nếu người dùng chọn tốt hơn, cộng điểm.
2. Nếu chọn tệ hơn, trừ điểm.
3. Điểm bị giới hạn trong khoảng 0 đến 100.
4. API cập nhật điểm chủ đề và có thể thưởng nếu tăng level.
5. App hiển thị thông báo đã ghi nhận.
6. App quay về scene kết quả theo chủ đề.

Luồng kết thúc check-in:

1. Khi scene đi tới `DO_LETTER_CHECK`, client gọi `POST /api/user/daily-checkin`.
2. API verify session cookie.
3. API kiểm tra `surveyType` có thuộc `study`, `emotion`, `sleep` không.
4. API đọc user hiện tại.
5. API tính `topicStreak`:
   - Nếu topic mới trùng topic cũ: tăng 1.
   - Nếu đổi topic: reset về 1.
6. API update:
   - `lastCheckinDate`.
   - `lastSurveyType`.
   - `topicStreak`.
   - `updatedAt`.
7. API set cookie `onboarding_step=done`.
8. Client chờ ngắn để cookie được ghi.
9. Người dùng bấm vào đảo.
10. Client chuyển `/homepage`.

Luồng tặng hạt giống trong daily:

1. Nếu nhánh `seeds_gift`, app sinh số hạt 3-5.
2. Khi người dùng click qua scene nhận quà, app gọi `/api/user/updateSeeds`.
3. App dispatch `userDataUpdated` để ProfileBar và Shop cập nhật.

## 11. Luồng trang chủ đảo

Trang `/homepage` là bản đồ đảo.

Khi tải trang:

1. Client gọi `/api/user/getUserInFo`.
2. Lấy username, điểm, tài nguyên, trạng thái cảm xúc.
3. Client gọi `/api/user/mailbox/inbox`.
4. Nếu có thư chưa đọc, hiển thị thông báo thư mới.
5. Client gọi `/api/auth/time` để xác định giờ hiện tại.
6. Nền hoặc trạng thái hiển thị thay đổi theo thời gian.

Các vùng click trên bản đồ:

- Hải Đăng: `/haidang`.
- Thần Thụ: `/thanthu`.
- Nhà Gỗ: `/nhago`.
- Suối Nguồn: `/suoinguon`.
- Vườn Hoa: `/vuonhoa`.
- Hồ Nước: `/honuoc`.
- Vách Đá: UI có route `/vachda`, nhưng trong code hiện tại chưa thấy page tương ứng.

Khi người dùng click một khu:

1. `handleZoneClick` set thông tin khu đang chọn.
2. UI mở modal giới thiệu khu vực.
3. Người dùng bấm đi đến.
4. `router.push(selectedZone.path)` chuyển trang.

Luồng thư mới:

1. Nếu inbox có thư chưa đọc, homepage hiện modal báo.
2. Người dùng có thể mở thư.
3. Client chuyển đến `/thanthu?mailbox=inbox`.
4. Trang Thần Thụ tự mở tab inbox.

## 12. Luồng thanh hồ sơ ProfileBar

`ProfileBar` được render toàn cục trong layout.

Luồng tải dữ liệu:

1. Lấy user từ `AuthContext`.
2. Lấy `userDataExtended` nếu đã có.
3. Component tự gọi `/api/user/getUserInFo?t=timestamp` để tránh cache.
4. Lắng nghe event `userDataUpdated`.
5. Khi event bắn ra, refetch user info.

Thông tin hiển thị:

- Avatar.
- Username.
- Điểm trạng thái gần nhất.
- Rank theo loại khảo sát.
- Tiền.
- Hạt giống.
- Lá.
- Tinh hoa lam, tím, vàng, cam.
- Điểm từng chủ đề: học tập, cảm xúc, giấc ngủ.

Rank được tính theo điểm. Điểm càng cao thì level/rank càng cao.

Vai trò của ProfileBar là làm bảng trạng thái hiện tại của người chơi, phản ánh ngay khi các khu vực khác cộng/trừ tài nguyên.

## 13. Luồng cửa hàng ShopGlobal

`ShopGlobal` cũng được render toàn cục.

Component chỉ hiển thị ở các route chính của đảo, không hiện trên login/register/survey/daily-checkin.

Luồng tải dữ liệu:

1. Lấy user data từ `AuthContext`.
2. Tự fetch `/api/user/getUserInFo`.
3. Lắng nghe `userDataUpdated`.
4. Khi người dùng mua hoặc nhận thưởng, shop cập nhật lại tài nguyên.

Shop có hai nhóm chính:

- Tab hạt giống/vật phẩm.
- Tab thú cưng.

Luồng mua thú cưng:

1. Người dùng chọn pet.
2. Component kiểm tra tài nguyên hiện tại.
3. Gọi `POST /api/shop/buyPet`.
4. API đọc `users/{userId}`.
5. API trừ tài nguyên theo `costType`:
   - `money`.
   - `leaves`.
   - `essence`.
6. API thêm pet name vào `ownedPets` bằng `FieldValue.arrayUnion`.
7. API tạo document mới trong collection `pets`.
8. Pet mới có:
   - `userId`.
   - `petId`.
   - `name`.
   - `hunger: 100`.
   - `thirst: 100`.
   - `xp: 0`.
   - `level: 1`.
   - `purchasedAt`.
   - `lastUpdated`.
   - `lastPetted` lùi 1 giờ để có thể vuốt ve ngay.
9. API batch update user và set pet.
10. Client dispatch `userDataUpdated`.

Luồng mua item thông thường:

1. Client tính updates tài nguyên.
2. Gọi `POST /api/shop/transaction`.
3. API update trực tiếp document `users/{userId}`.
4. Client cập nhật UI và bắn event.

## 14. Luồng cài đặt âm lượng và đăng xuất

`SettingsButton` quản lý âm lượng toàn app.

Luồng âm lượng:

1. Khi mở component, đọc `app_volume` và `app_muted` từ localStorage.
2. Khi người dùng kéo volume, component lưu lại localStorage.
3. Component dispatch event `app-volume-change`.
4. Các khu vực có audio như Nhà Gỗ, Hồ Nước, Survey, Daily Check-in nghe event này để chỉnh âm lượng.
5. Component cũng dùng MutationObserver để áp volume cho các thẻ audio xuất hiện sau.

Luồng mute:

1. Người dùng bấm mute.
2. `app_muted` đổi true/false.
3. Event `app-volume-change` được phát.
4. Audio đang phát chuyển volume về 0 hoặc volume đã lưu.

Luồng đăng xuất:

1. Người dùng chọn logout.
2. Component hỏi xác nhận.
3. Gọi `/api/auth/logout`.
4. Server xóa cookie.
5. Người dùng rời phiên đăng nhập.

## 15. Luồng mini check-in định kỳ

`PeriodicCheckin` là popup hỏi trạng thái trong lúc người dùng đang ở các khu vực của đảo.

Component không hoạt động ở:

- `/`
- `/login`
- `/register`
- `/survey`
- `/daily-checkin`

Luồng hoạt động:

1. Component tải user info từ `/api/user/getUserInFo`.
2. Lấy `lastSurveyType` và `lastSurveyScore`.
3. Sau một khoảng thời gian, bật popup hỏi trạng thái.
4. Người dùng chọn tốt hơn hoặc tệ hơn.
5. Người dùng chọn mức sao.
6. Component tính score mới.
7. Gọi `/api/user/updateMiniSurvey`.
8. Nếu API trả reward level-up, popup hiển thị phần thưởng.
9. Dispatch `userDataUpdated`.

Mục tiêu của luồng này là cho phép người dùng cập nhật trạng thái tinh thần mà không phải rời khu vực đang sử dụng.

## 16. Luồng Thần Thụ

Trang `/thanthu` là khu trung tâm có cây thần và hòm thư tương lai.

Khi tải trang:

1. Gọi `/api/auth/time`.
2. Dựa vào giờ hiện tại để chọn ảnh nền.
3. Mỗi phút cập nhật lại ảnh nền.

### 16.1. Luồng rung cây nhận thưởng

Client:

1. Người dùng click cây.
2. Nếu đang trong animation rung, bỏ qua.
3. Set `isShaking=true`.
4. Gọi `POST /api/user/leaves/shake`.

Server:

1. Đọc session cookie.
2. Verify session bằng Firebase Admin.
3. Mở transaction trên `users/{uid}`.
4. Đọc `lastShakeAt`.
5. Nếu chưa qua cooldown 5 giây, trả 429 và `retryAfterMs`.
6. Nếu hợp lệ, random reward:
   - 60% lá.
   - 30% coin/vàng.
   - 10% seed/hạt giống.
7. Dùng `FieldValue.increment` để cộng tài nguyên.
8. Update `lastShakeAt`.

Client sau khi nhận response:

1. Nếu 429, hiển thị thông báo cần chờ.
2. Nếu thành công, spawn particle tương ứng.
3. Hiển thị alert phần thưởng.
4. Dispatch `userDataUpdated`.

### 16.2. Luồng hòm thư tương lai

Hòm thư có hai tab:

- Viết thư.
- Hộp thư đến.

Luồng gửi thư:

1. Người dùng mở hòm thư.
2. Nhập nội dung.
3. Client gọi `POST /api/user/mailbox/send`.
4. API verify session.
5. API validate content:
   - Không rỗng.
   - Không quá 2000 ký tự.
6. API tạo document trong `mailbox/{uid}/letters`.
7. Document có:
   - `content`.
   - `sent_at`.
   - `deliver_at`.
   - `is_read: false`.
   - `status: pending`.
8. Client xóa nội dung và đóng modal.

Lưu ý kỹ thuật: UI đang nói thư giao sau 24 giờ, nhưng API hiện set `deliverAt` sau 5 giây. Nếu muốn đúng nghiệp vụ 24 giờ, cần đổi `deliverAt.setSeconds(...)` thành cộng 24 giờ.

Luồng mở inbox:

1. Client gọi `GET /api/user/mailbox/inbox`.
2. API verify session.
3. API lấy thời điểm hiện tại.
4. API query các thư `pending` có `deliver_at <= now`.
5. API batch update các thư này thành:
   - `status: delivered`.
   - `is_read: false`.
6. API query các thư có status `delivered` hoặc `read`.
7. API trả danh sách thư sắp xếp theo `deliver_at desc`.

Luồng đọc thư:

1. Người dùng click một thư.
2. Client set `selectedLetter`.
3. Nếu thư chưa đọc, gọi `POST /api/user/mailbox/read`.
4. API verify session và chỉ truy cập thư của đúng user.
5. Nếu thư còn `pending`, API không cho đọc.
6. Nếu thư đã `deleted`, API trả lỗi.
7. Nếu hợp lệ, API update:
   - `is_read: true`.
   - `status: read`.
8. Client cập nhật state cục bộ.

Luồng xóa thư:

1. Người dùng bấm xóa.
2. UI hiện confirm.
3. Client gọi `DELETE /api/user/mailbox/delete`.
4. API verify session.
5. API update thư:
   - `status: deleted`.
   - `is_read: true`.
   - `deleted_at`.
6. Client loại thư khỏi danh sách.

## 17. Luồng Vườn Hoa

Trang `/vuonhoa` là khu trồng cây và thu hoạch tinh hoa.

Khi vào trang:

1. Component lấy `firebaseUser`, `userDataExtended`, `plots` từ `AuthContext`.
2. Nếu có user, gọi `refreshGameData()`.
3. Context gọi `/api/user/getUserInFo` và `/api/garden/get`.
4. Trang đồng bộ:
   - `seedCount`.
   - `moneyCount`.
   - `essences`.
   - `plots`.

### 17.1. Dữ liệu ô đất

Mỗi ô đất có các trạng thái:

- `empty`: đất trống.
- `menu`: đang mở menu chọn cây.
- `growing`: cây đang phát triển.
- `mature`: cây trưởng thành, có thể thu hoạch.
- `reward`: đang hiển thị phần thưởng.
- `dead`: cây chết.

Mỗi plot chứa:

- `id`.
- `status`.
- `selectedTree`.
- `timeLeft`.
- `totalGrowTime`.
- `endTime`.
- `reward`.
- `isThirsty`.
- `waterCount`.
- `deathTime`.

### 17.2. Luồng mở menu trồng cây

1. Người dùng click ô đất trống.
2. Nếu ô đang `empty`, trạng thái đổi thành `menu`.
3. Nếu có ô khác đang `menu`, ô đó bị đóng về `empty`.
4. Trang gọi `/api/garden/save` để lưu plots mới.

### 17.3. Luồng trồng cây

1. Người dùng chọn cây trong menu.
2. Client kiểm tra đã đăng nhập chưa.
3. Client kiểm tra đủ hạt giống chưa.
4. Nếu thiếu hạt, hiển thị alert.
5. Nếu đủ:
   - Trừ `seedCount`.
   - Gọi `/api/user/updateSeeds`.
   - Cập nhật `userDataExtended` để ProfileBar đổi ngay.
6. Tính thời gian phát triển:
   - Nếu `TEST_MODE`, dùng 30 giây.
   - Nếu không, dùng `tree.growTimeSeconds`.
7. Set plot thành:
   - `status: growing`.
   - `selectedTree`.
   - `timeLeft`.
   - `totalGrowTime`.
   - `isThirsty: true`.
   - `waterCount: 0`.
   - `deathTime = now + growSeconds * 3`.
8. Gọi `/api/garden/save`.

Ý nghĩa: cây vừa trồng sẽ khát nước ngay. Nếu không tưới trong thời gian cho phép, cây chết.

### 17.4. Luồng tưới cây

1. Người dùng bấm tưới trên cây đang khát.
2. Client kiểm tra `moneyCount >= WATER_COST`.
3. `WATER_COST` hiện là 5.
4. Nếu thiếu tiền, hiển thị alert.
5. Nếu đủ:
   - Chạy animation bình tưới.
   - Sau 1 giây, trừ tiền.
   - Gọi `/api/user/updateMoney`.
   - Cập nhật `userDataExtended`.
   - Tính `newEndTime = now + timeLeft`.
   - Update plot:
     - `isThirsty: false`.
     - `waterCount + 1`.
     - `endTime`.
     - `deathTime: null`.
6. Gọi `/api/garden/save`.

### 17.5. Luồng xử lý thời gian cây

Hàm `processPlotTime` xử lý liên tục trong `useEffect`.

Nếu cây đang `growing` và `isThirsty=true`:

- Nếu `Date.now() >= deathTime`, cây chuyển `dead`.
- Nếu chưa tới hạn chết, giữ nguyên.

Nếu cây đang `growing` và không khát:

1. Tính `remaining = (endTime - now) / 1000`.
2. Tính các mốc cần tưới dựa trên tổng thời gian:
   - Mốc 2/3.
   - Mốc 1/3.
3. Nếu tới mốc cần tưới, cây chuyển sang `isThirsty=true`, dừng đếm và set `deathTime`.
4. Nếu qua hết các mốc, cây chuyển `mature`.

### 17.6. Luồng thu hoạch

1. Người dùng click cây `mature`.
2. Trang set `harvestingPlotId` để chạy animation.
3. Sau 800ms, app random tinh hoa theo độ hiếm của cây.

Tỉ lệ theo rarity:

- Cây thường:
  - Chủ yếu ra tinh hoa lam.
  - Có tỉ lệ thấp ra tím hoặc vàng.
- Cây hiếm:
  - Tỉ lệ tím/vàng cao hơn.
  - Có tỉ lệ rất nhỏ ra cam.
- Cây sử thi:
  - Tỉ lệ vàng và cam cao hơn.
- Cây huyền thoại:
  - Chủ yếu ra vàng/cam, không ra lam.

Sau khi random:

1. Plot chuyển `status: reward`.
2. `reward` chứa loại tinh hoa, tên, màu, icon, id.
3. Người dùng đóng popup reward.
4. Client cộng tinh hoa vào state.
5. Gọi `/api/user/updateEssence`.
6. Cập nhật `userDataExtended`.
7. Reset plot về `empty`.

### 17.7. Luồng dọn cây chết

1. Nếu plot `dead`, UI hiển thị cây chết.
2. Người dùng bấm dọn.
3. Trang set `clearingPlotId`.
4. Chạy animation 800ms.
5. Reset plot:
   - `status: empty`.
   - `selectedTree: null`.
   - `deathTime: null`.
   - `isThirsty: false`.
   - `waterCount: 0`.
6. Gọi `/api/garden/save`.

## 18. Luồng Trại Thú Cưng

Trang `/thucung` quản lý các pet người dùng đã mua.

### 18.1. Tải dữ liệu thú cưng

Khi vào trang:

1. Client gọi `GET /api/pets/get`.
2. API verify session.
3. API query collection `pets` với `where('userId', '==', uid)`.
4. Nếu không có pet, trả mảng rỗng.
5. Nếu có pet, API tính thời gian offline:
   - Lấy `lastUpdated`.
   - Tính số phút đã trôi qua.
   - Cứ 2 phút trừ 1 điểm đói và khát.
6. API batch update hunger/thirst mới vào Firestore.
7. API trả danh sách pet đã tính decay.

Client sau đó còn tính decay một lần nữa theo `lastUpdated` với mốc test 5 giây. Khi chạy thật, phần comment cho thấy nên đổi về 120000ms.

### 18.2. Lưu trạng thái khi rời trang

Trang dùng `beforeunload`.

1. Khi người dùng F5, đóng tab hoặc component unmount.
2. Hàm `saveAllPetsState` lấy danh sách pet hiện tại.
3. Gọi `POST /api/pets/update` với `{ pets: petsToSave }`.
4. Request có `keepalive: true`.
5. API batch update toàn bộ pet.

### 18.3. Giảm chỉ số theo thời gian thật

Client tạo interval mỗi 120 giây:

1. Giảm `hunger` của từng pet đi 1.
2. Giảm `thirst` của từng pet đi 1.
3. Nếu đang mở pet chi tiết, cập nhật cả `selectedPet`.

### 18.4. Chọn và hiển thị pet

Khi người dùng chọn pet:

1. `selectedPet` được set.
2. UI hiển thị ảnh pet.
3. Ảnh phụ thuộc:
   - `petId`.
   - `level`.
   - `hunger`.
   - `thirst`.
4. Nếu level >= 10, pet dùng ảnh adult.
5. Nếu đói hoặc khát dưới 50, dùng ảnh sad.

### 18.5. Tương tác cơ bản

Có ba hành động:

- Cho ăn.
- Cho uống.
- Vuốt ve.

Luồng xử lý:

1. Client kiểm tra `selectedPet`.
2. Tùy action, tính chỉ số mới:
   - Feed: tăng hunger, tăng XP.
   - Water: tăng thirst, tăng XP.
   - Pet: tăng XP và update `lastPetted`.
3. Nếu XP đạt `level * 100`:
   - Tăng level.
   - Trừ XP yêu cầu.
   - Hiển thị alert level up.
4. Cập nhật `selectedPet`.
5. Cập nhật `myPets`.
6. Gọi `/api/pets/update`.

Vuốt ve có cooldown 1 giờ, được tính bằng:

`Date.now() - selectedPet.lastPetted >= 3600000`

### 18.6. Mua đồ ăn và cho ăn

1. Người dùng mở menu đồ ăn.
2. Chọn món.
3. Client kiểm tra tiền.
4. Client kiểm tra pet đã no chưa.
5. Nếu hợp lệ:
   - Trừ tiền trong `userDataExtended` để UI đổi ngay.
   - Tăng hunger theo món.
   - Tăng XP theo món.
   - Kiểm tra level up.
   - Lưu pet qua `/api/pets/update`.

Lưu ý: trong đoạn code đọc được, phần mua đồ ăn/uống cập nhật tiền trên context nhưng chưa thấy gọi API riêng để persist tiền đã trừ. Cần kiểm tra thêm hoặc bổ sung gọi `/api/user/updateMoney` nếu muốn đảm bảo số tiền được lưu chắc chắn.

### 18.7. Mua đồ uống và cho uống

Luồng tương tự đồ ăn:

1. Kiểm tra tiền.
2. Kiểm tra pet có khát không.
3. Trừ tiền trên UI.
4. Tăng thirst.
5. Tăng XP.
6. Check level up.
7. Gọi `/api/pets/update`.

### 18.8. Đổi tên pet

1. Người dùng bật chế độ rename.
2. Nhập tên mới.
3. Client cập nhật UI ngay.
4. Gọi `/api/pets/update` với `name`.
5. API update document pet.

## 19. Luồng Nhà Gỗ Bình Yên

Trang `/nhago` là khu nghỉ ngơi và âm nhạc.

Khi tải trang:

1. Client tạo `audioRef`.
2. Client đọc volume toàn cục từ localStorage.
3. Client lắng nghe event `app-volume-change`.
4. Client lấy dữ liệu nhạc từ Firestore client:
   - `music/fm_stations`.
   - `music/lofi_tracks`.
5. Client xác định session thời gian:
   - `night`.
   - `sunrise`.
   - `midday`.
   - `afternoon`.
6. Nền đổi theo session.

Luồng tìm nhạc:

1. Người dùng nhập `searchQuery`.
2. `handleSearch` lọc `lofiTracks` theo tên bài.
3. Kết quả hiển thị trong panel.

Luồng phát nhạc lofi:

1. Người dùng chọn bài hoặc bấm play lofi.
2. `toggleMusic('lofi')` xác định nguồn nhạc.
3. Nếu chọn bài cụ thể, dùng `trackUrl`.
4. Nếu không, dùng bài đầu tiên trong `lofiTracks`.
5. Nếu không có dữ liệu, fallback `/audio/demo.mp3`.
6. Gán `audio.src`, `audio.load()`.
7. Set volume theo settings.
8. `audio.play()`.
9. Set `isPlaying=true`, `musicType='lofi'`.

Luồng phát FM:

1. Người dùng mở panel FM.
2. Bấm play hoặc next.
3. `toggleMusic('fm', isNext)` lấy station theo `currentStationIndex`.
4. Nếu phát lỗi:
   - Tăng retry count.
   - Thử kênh tiếp theo sau 2 giây.
   - Nếu lỗi hết danh sách, fallback sang lofi.

Luồng ngủ/nghỉ:

1. Người dùng bấm chế độ võng/ngủ.
2. `isSleeping` đổi trạng thái.
3. UI chuyển sang không gian tối/êm hơn để nghỉ ngơi.

## 20. Luồng Hải Đăng

Trang `/haidang` là khu tập trung, định hướng và âm thanh chữa lành.

Khi tải trang:

1. Client set giờ local để tránh trễ render.
2. Gọi `/api/auth/time` để lấy giờ chuẩn.
3. Mỗi phút cập nhật giờ.
4. Tính `timeStage`:
   - dawn.
   - morning.
   - noon.
   - afternoon.
   - night.
5. Chọn nền theo `timeStage`.
6. Có hai tầng:
   - Tầng 1.
   - Tầng 2.

### 20.1. Tầng 1

Các vùng click:

- Hải đồ tương lai.
- Nhật ký neo đậu.
- La bàn tiến độ.
- Mẫu giấy nhỏ.
- Giới thiệu.
- Lối lên tháp vọng.
- Lối ra homepage.

Khi click một vùng:

1. `openModal(tab)` set `activeModalTab`.
2. `isModalOpen=true`.
3. `LighthouseModalContainer` mở đúng tab.

### 20.2. Tầng 2

Các vùng click:

- Đồng hồ tập trung.
- Radio chữa lành.
- Lối xuống tầng 1.

Khi lên tầng 2:

1. `floor=2`.
2. Background tầng 1 fade out.
3. Background tầng 2 fade in.
4. `GlobalAudioPlayer` vẫn tồn tại để quản lý audio chung.

### 20.3. Task service của Hải Đăng

File `taskService.ts` dùng Firebase client để thao tác:

Collection `tasks`:

- `userId`.
- `title`.
- `description`.
- `icon`.
- `type`: `short` hoặc `long`.
- `difficulty`: `easy`, `medium`, `hard`.
- `status`: `in_progress`, `completed`, `missed`.
- `startDate`.
- `endDate`.
- `progress`.
- `longTaskId`.

Collection `commits`:

- `taskId`.
- `userId`.
- `title`.
- `description`.
- `oldProgress`.
- `newProgress`.
- `createdAt`.

Các hàm chính:

- `addTask`.
- `getTasks`.
- `updateTask`.
- `deleteTask`.
- `deleteMultipleTasks`.
- `getCommitsByTask`.
- `addCommit`.
- `getGold`.
- `addGold`.

`addGold` dùng Firestore `increment`, sau đó dispatch:

- `userDataUpdated`.
- `GOLD_UPDATED`.

### 20.4. Hải đồ tương lai

Luồng:

1. Tab tải long tasks và short tasks của user.
2. Hiển thị nhiệm vụ dài hạn và nhiệm vụ ngắn hạn.
3. Người dùng xem định hướng tổng quan.
4. Dữ liệu lấy từ collection `tasks`.

### 20.5. Nhật ký neo đậu

Luồng:

1. Tab tải long tasks.
2. Người dùng lọc theo trạng thái.
3. Người dùng chọn task để xem chi tiết.
4. Có thể xem lịch sử commit.
5. Có thể chọn nhiều task để xóa.
6. Khi xóa long task, service cũng xóa các short task liên kết bằng `longTaskId`.

### 20.6. Mẫu giấy nhỏ

Luồng tạo task ngắn:

1. Người dùng mở dialog thêm task.
2. Nhập title, mô tả, icon, độ khó, ngày bắt đầu/kết thúc.
3. Có thể liên kết với long task.
4. Gọi `addTask`.
5. Task được lưu vào collection `tasks`.

Luồng hoàn thành task:

1. Người dùng bấm hoàn thành.
2. Tab gọi `updateTask` đổi status thành `completed`.
3. Tính gold reward.
4. Gọi `addGold`.
5. ProfileBar cập nhật qua event.

Nếu short task liên kết long task, UI có thể gợi ý chuyển sang La bàn tiến độ để cập nhật long task.

### 20.7. La bàn tiến độ

Luồng:

1. Tab tải long tasks.
2. Người dùng chọn một long task.
3. Tab tải commit history bằng `getCommitsByTask`.
4. Người dùng kéo slider progress.
5. Khi xác nhận, mở modal nhập title/mô tả commit.
6. Gọi `addCommit`.
7. Gọi `updateTask` để update progress.
8. Nếu progress đạt 100%, task có thể chuyển completed.
9. Tính gold reward theo mức tiến bộ.
10. Gọi `addGold`.
11. Reload commits và cập nhật UI.

### 20.8. Đồng hồ tập trung

Luồng:

1. Người dùng chọn giờ, phút, giây.
2. Bấm start.
3. Timer bắt đầu đếm ngược.
4. Có thể pause hoặc stop.
5. Khi timer về 0, gọi `handleFinish`.
6. Tính reward.
7. Gọi `addGold(userId, reward)`.
8. Hiển thị popup thưởng.

### 20.9. Radio chữa lành

Luồng:

1. Người dùng mở radio.
2. Chọn thể loại.
3. Chọn track hoặc random track.
4. Store audio lưu `currentGenre`, `currentTrack`.
5. `GlobalAudioPlayer` thấy track mới.
6. Component gọi `/api/user/lighthouse/audio?file=...`.
7. API tạo signed URL từ Cloudflare R2.
8. Audio player phát URL nhận được.
9. Màu ánh sáng tầng 2 đổi theo genre đang phát.

## 21. Luồng Suối Nguồn Cảm Xúc

Trang `/suoinguon` là khu tâm sự, nhật ký, lời chúc, trò chuyện và video chữa lành.

Khi tải trang:

1. Lấy user từ `AuthContext`.
2. Gọi `/api/auth/time`.
3. Chọn background theo giờ:
   - 0h.
   - 6h.
   - 8h.
   - 12h.
   - 16h.
   - 18h.
   - 21h.
4. Mỗi 10 phút cập nhật lại background.

### 21.1. Luồng thuyền tâm sự

1. Người dùng click vùng nước.
2. Modal `ThaThuyenModal` mở.
3. Người dùng nhập tâm sự.
4. Bấm thả trôi.
5. Page tạo một boat của người dùng:
   - `isMine: true`.
   - `message`.
   - `pathClass: path-mine`.
6. Boat xuất hiện và chạy animation 20 giây.
7. Trong lúc boat của user đang trôi, app tạm ngừng sinh boat random.
8. Sau 20 giây, boat biến mất.

Luồng này chỉ là trải nghiệm client, không lưu nội dung vào Firestore.

### 21.2. Luồng thuyền ngẫu nhiên

1. Nếu không có boat của user đang trôi, interval mỗi 5 giây chạy.
2. App random path và ảnh thuyền.
3. Thêm boat vào state.
4. Sau 20 giây xóa boat.

### 21.3. Luồng bong bóng video

1. Interval mỗi 8 giây gọi `/api/get-random-video`.
2. API đọc collection `healings-video`.
3. API lấy tất cả document có `videoId`.
4. API random một `videoId`.
5. Client tạo bubble với:
   - `videoId`.
   - vị trí left random.
   - duration random 40-60 giây.
   - ảnh bubble random.
6. Bubble bay lên màn hình.
7. Sau 60 giây tự biến mất.
8. Người dùng click bubble.
9. `playingVideoId` được set.
10. Modal `RapChieuPhim` mở.

### 21.4. Luồng rạp chiếu phim

1. Modal nhận `initialVideoId`.
2. Mặc định ở mode `playing`.
3. Người dùng có thể chuyển sang browse.
4. Browse gọi `/api/get-videos-list?chude=...`.
5. API query `healings-video`, có thể lọc theo `chude`.
6. API trả danh sách video.
7. Người dùng click video khác.
8. Modal chuyển video đang phát.

### 21.5. Luồng nhật ký Suối Nguồn

Modal `NhatKy` có các mode:

- `cover`.
- `menu`.
- `write`.
- `read`.
- `view`.

Luồng viết nhật ký:

1. Người dùng mở nhật ký.
2. Chọn viết nhật ký mới.
3. Nhập title và nội dung trên các trang.
4. Bấm lưu.
5. Client gọi `POST /api/diary`.
6. API lưu vào collection `diaries`:
   - `uid`.
   - `email`.
   - `title`.
   - `content`.
   - `createdAt`.
7. UI báo thành công.

Luồng đọc nhật ký:

1. Người dùng chọn đọc nhật ký cũ.
2. Client gọi `GET /api/diary?uid=...`.
3. API query `diaries` theo `uid`, order by `createdAt desc`.
4. Client hiển thị mục lục.
5. Người dùng chọn entry.
6. Modal mở nội dung entry theo dạng trang sách.

### 21.6. Luồng cây ban phước

1. Người dùng click cây.
2. Modal `CayThanBanPhuoc` mở.
3. Người dùng chọn loại lá:
   - `green`.
   - `red`.
   - `yellow`.
4. Client gọi `/api/wish?type=leafType`.
5. API kiểm tra type hợp lệ.
6. API query collection `wishes` theo `type`.
7. API lấy các field `text`.
8. API random một lời chúc.
9. API delay 800ms để tạo cảm giác lá rơi.
10. Client hiển thị lời chúc.

### 21.7. Luồng góc trò chuyện với bot AI

Modal `GocTroChuyen` có lựa chọn chat với bot hoặc ghép người lạ.

Luồng bắt đầu bot chat:

1. Client gọi `GET /api/bot-chat`.
2. API verify session.
3. API tìm session bot gần nhất trong `users/{uid}/bot_chats`.
4. Nếu chưa có, tạo session mới.
5. Session mới có welcome message.
6. API trả `sessionId`, `summary`, `messages`.

Luồng gửi tin nhắn cho bot:

1. Người dùng nhập tin nhắn.
2. Client lưu message của user qua `/api/bot-chat` action `saveMessage`.
3. Client gọi `/api/gemini-chat` với:
   - `message`.
   - `history`.
   - `summary`.
4. API Gemini chuẩn hóa history.
5. API thêm system prompt tiếng Việt, vai trò là bạn đồng hành nhẹ nhàng.
6. API gọi Gemini model.
7. Nếu lỗi quota và có nhiều API key, thử key tiếp theo.
8. Nếu Gemini trả nội dung lỗi/cụt, dùng fallback reply.
9. API trả `reply`.
10. Client hiển thị reply.
11. Client lưu reply của bot qua `/api/bot-chat`.
12. Summary được cập nhật để giữ ngữ cảnh ngắn.

Các action khác của `/api/bot-chat`:

- `createSession`: tạo phiên mới.
- `listSessions`: lấy danh sách phiên.
- `loadSession`: tải phiên cũ.
- `saveMessage`: lưu tin nhắn.
- `deleteSession`: soft delete session.
- `exportSession`: export toàn bộ tin nhắn.

### 21.8. Luồng ghép trò chuyện người lạ

Luồng bắt đầu matching:

1. Client lấy user info qua `/api/user/getUserInFo`.
2. Lấy điểm cảm xúc hoặc điểm khảo sát hiện tại.
3. Gửi `POST /api/match` với:
   - `uid`.
   - `emotionScore`.
   - `name`.

API matching:

1. Tính rank cảm xúc bằng `Math.floor(emotionScore / 10)`.
2. Tạo danh sách rank cho phép: rank hiện tại ±2.
3. Query collection `waiting_room`:
   - `status == waiting`.
   - `rank in allowedRanks`.
   - limit 1.
4. Loại bỏ chính user hiện tại.
5. Nếu tìm thấy đối phương:
   - Tạo document mới trong `chat_rooms`.
   - Lưu `users: [uid, opponentId]`.
   - Update ticket của đối phương thành `matched`.
   - Lưu `roomId`, `matchedWith`, tên và score.
   - Trả `matched: true`.
6. Nếu không tìm thấy:
   - Xóa ticket cũ của user nếu có.
   - Tạo ticket mới trong `waiting_room`.
   - Trả `matched: false`, `waitingId`.

Luồng gửi tin nhắn:

1. Client gửi `POST /api/send`.
2. API lưu message vào `chat_rooms/{roomId}/messages`.
3. API update `lastMessageAt` của room.
4. Client realtime listener trên `messages` để nhận tin mới.

Luồng rời phòng:

1. Client gọi `POST /api/chat/leave`.
2. API thêm tin nhắn hệ thống: người trò chuyện đã rời phòng.
3. API update room:
   - `status: ended`.
   - `endedAt`.

## 22. Luồng Hồ Nước Soi Bóng

Trang `/honuoc` là khu soi cảm xúc bằng camera.

Khi tải trang:

1. Set `isClient=true`.
2. Đọc volume toàn cục.
3. Tạo audio nền `/audio/healing-bg.m4a`.
4. Lắng nghe `app-volume-change`.
5. Lắng nghe `storage` để cập nhật volume khi localStorage đổi.
6. Thử autoplay audio; nếu browser chặn, chờ click/touch đầu tiên.
7. Tải model face-api:
   - `tinyFaceDetector`.
   - `faceLandmark68TinyNet`.
   - `faceExpressionNet`.
8. Xác định session nền theo giờ.

### 22.1. Luồng chạm mặt nước

1. Người dùng click vùng nước.
2. App tính tọa độ tương đối.
3. Thêm ripple vào state.
4. Thêm các giọt nước nhỏ vào state.
5. CSS animation làm sóng lan và giọt bắn.
6. Sau thời gian animation, state được dọn.

### 22.2. Luồng mở Gương Thần

1. Người dùng click nút Gương Thần Tâm Hồn.
2. `isOpen=true`.
3. Khung gương xuất hiện.
4. Trạng thái ban đầu là `idle`.

### 22.3. Luồng soi cảm xúc

1. Người dùng click vào khung gương.
2. Hàm `startHealing` xin quyền camera.
3. Nếu được cấp quyền:
   - Gắn stream vào video.
   - Set `status=preparing`.
   - Sau đó chuyển `watching`.
   - Bắt đầu countdown.
4. Khi countdown về 0:
   - Chụp snapshot từ video.
   - Set `status=healing`.
   - Gọi `analyzeEmotionAndGetMessage`.
   - Dừng camera.

### 22.4. Luồng phân tích cảm xúc

1. `face-api.js` detect khuôn mặt.
2. Lấy expression scores.
3. Chọn emotion có score cao nhất.
4. Gọi `fetchFirebaseEmotionMessage(primaryEmotion)`.
5. Hàm này đọc Firestore client:
   - Collection/document: `emotion_messages/{emotion}`.
   - Field: `texts`.
6. Nếu có texts, random một câu.
7. Nếu không có dữ liệu hoặc lỗi, dùng fallback message.
8. UI hiển thị ảnh snapshot và lời thì thầm.

Nếu camera lỗi, model lỗi hoặc không detect được mặt, hệ thống vẫn có fallback để người dùng không bị kẹt.

## 23. Luồng Thần Thú / Tài nguyên liên kết

Tài nguyên trong hệ thống liên kết theo vòng:

- Daily check-in có thể tặng hạt giống.
- Cây thần có thể tặng lá, vàng, hạt giống.
- Vàng dùng để tưới cây, mua item, mua/chăm sóc pet.
- Hạt giống dùng để trồng cây ở Vườn Hoa.
- Cây trưởng thành sinh tinh hoa.
- Tinh hoa dùng để mua pet hiếm trong shop.
- Pet tạo động lực quay lại chăm sóc.
- Survey score tạo rank và có thể thưởng khi lên level.

Điểm hay của hệ thống là mỗi khu vực không đứng riêng lẻ. Hoạt động ở khu này tạo tài nguyên hoặc dữ liệu cho khu khác.

## 24. Luồng API user data

### 24.1. `/api/user/getUserInFo`

Đây là API đọc user chính.

Luồng:

1. Đọc cookie `session`.
2. Verify session cookie.
3. Đọc `users/{uid}`.
4. Trả về:
   - `userId`.
   - `username`.
   - `lastSurveyScore`.
   - `lastSurveyType`.
   - `lastLoginDate`.
   - `topicStreak`.
   - `survey_study`.
   - `survey_emotion`.
   - `survey_sleep`.
   - `money`.
   - `seeds`.
   - `leaves`.
   - `essence_*`.
   - `ownedPets`.

### 24.2. `/api/user/updateMiniSurvey`

API cập nhật điểm khảo sát và thưởng level.

Luồng:

1. Verify session cookie.
2. Đọc `topic`, `newScore`.
3. Đọc user hiện tại.
4. Lấy `oldScore`.
5. Tính `oldLevel`, `newLevel`.
6. Update score.
7. Nếu tăng level, random reward và dùng `FieldValue.increment`.
8. Update Firestore.
9. Set cookie onboarding phù hợp.
10. Trả reward nếu có.

### 24.3. `/api/user/daily-checkin`

API lưu lượt check-in.

Luồng:

1. Verify session.
2. Validate `surveyType`.
3. Đọc user.
4. Tính streak theo topic.
5. Update `lastCheckinDate`, `lastSurveyType`, `topicStreak`, `updatedAt`.
6. Set onboarding cookie `done`.

### 24.4. `/api/user/updateMoney`, `/api/user/updateSeeds`, `/api/user/updateEssence`

Các API này nhận số lượng mới từ client và update vào Firestore.

Chức năng:

- `updateMoney`: update `money`.
- `updateSeeds`: update `seeds`.
- `updateEssence`: update `essence_${id}`.

Lưu ý: các API này nhận `userId` từ body, nên nếu muốn an toàn hơn cần verify session và so khớp `decoded.uid === userId`.

## 25. Luồng Garden API

### 25.1. `/api/garden/get`

1. Verify session cookie.
2. Lấy `uid`.
3. Đọc `gardens/{uid}`.
4. Nếu chưa có garden, trả default plots.
5. Nếu có, trả dữ liệu garden.

### 25.2. `/api/garden/save`

1. Đọc `userId`, `plots` từ body.
2. Validate dữ liệu tồn tại.
3. Ghi vào `gardens/{userId}`:
   - `plots`.
   - `lastUpdatedAt`.
4. Dùng `{ merge: true }`.

Lưu ý: route này hiện chưa verify session khớp `userId`.

## 26. Luồng Pets API

### 26.1. `/api/pets/get`

1. Verify session.
2. Query `pets` theo `userId`.
3. Tính thời gian offline.
4. Trừ hunger/thirst.
5. Batch update Firestore.
6. Trả danh sách pet.

### 26.2. `/api/pets/update`

API hỗ trợ hai mode:

Mode 1: update nhiều pet.

1. Body có `pets`.
2. API batch update từng pet:
   - `hunger`.
   - `thirst`.
   - `xp`.
   - `level`.
   - `lastPetted`.
   - `lastUpdated`.

Mode 2: update một pet.

1. Body có `petId`.
2. API update pet document.
3. Nếu có `name`, update tên.

## 27. Luồng video và lời nhắn chữa lành

### 27.1. `/api/get-random-video`

1. Đọc collection `healings-video`.
2. Lấy tất cả field `videoId`.
3. Random một video.
4. Trả `{ videoId }`.

### 27.2. `/api/get-videos-list`

1. Đọc query `chude`.
2. Nếu `chude` khác `tat-ca`, query theo field `chude`.
3. Lấy danh sách video có `videoId`.
4. Trả `id`, `videoId`, `title`, `chude`.

### 27.3. `/api/quotes/get`

1. Đọc collection `healing_messages`.
2. Lấy field `text`.
3. Trả danh sách câu chữa lành.

### 27.4. `/api/wish`

1. Đọc query `type`.
2. Validate `green`, `red`, `yellow`.
3. Query collection `wishes`.
4. Random một lời chúc.
5. Trả `{ wish, type }`.

## 28. Luồng chat

### 28.1. Chat bot

`/api/bot-chat` lưu lịch sử, còn `/api/gemini-chat` sinh phản hồi.

Luồng lưu session:

1. Mỗi user có subcollection `users/{uid}/bot_chats`.
2. Mỗi session có:
   - `summary`.
   - `createdAt`.
   - `updatedAt`.
   - `deletedAt`.
3. Mỗi session có subcollection `messages`.

Luồng Gemini:

1. Nhận message.
2. Chuẩn hóa history.
3. Thêm system prompt.
4. Gọi Gemini.
5. Làm sạch câu trả lời.
6. Fallback nếu câu trả lời cụt hoặc lỗi.

### 28.2. Chat người lạ

Collections:

- `waiting_room`.
- `chat_rooms`.
- `chat_rooms/{roomId}/messages`.

Luồng:

1. User gửi điểm cảm xúc để match.
2. API tìm người có rank gần.
3. Nếu có, tạo room.
4. Nếu không, tạo ticket chờ.
5. Khi vào room, client realtime listener messages.
6. Tin nhắn gửi qua `/api/send`.
7. Rời phòng qua `/api/chat/leave`.

## 29. Luồng thời gian trong hệ thống

API `/api/auth/time` được nhiều trang dùng để đồng bộ thời gian:

- Homepage.
- Hải Đăng.
- Thần Thụ.
- Suối Nguồn.

Luồng:

1. API gọi `https://timeapi.io/api/Time/current/zone?timeZone=Asia/Ho_Chi_Minh`.
2. Nếu thành công, trả `hour`, `minute`, `localTime`, `source: timeapi`.
3. Nếu lỗi, dùng fallback bằng `Intl.DateTimeFormat` với timezone `Asia/Ho_Chi_Minh`.
4. Các page dùng `hour` để đổi nền theo buổi.

## 30. Các điểm cần lưu ý kỹ thuật

### 30.1. Một số API cần tăng bảo mật

Các API như `updateMoney`, `updateSeeds`, `garden/save`, `shop/transaction`, `buyPet` đang nhận `userId` từ body. Nếu triển khai thật, nên:

1. Verify session cookie.
2. Lấy `uid` từ decoded token.
3. Không tin `userId` client gửi.
4. Chỉ update document của `uid`.

### 30.2. Thời gian giao thư chưa khớp UI

UI nói thư tương lai được giao sau 24 giờ, nhưng API hiện set giao sau 5 giây. Đây có thể là chế độ test. Nếu nộp báo cáo, nên ghi rõ đang để demo hoặc sửa lại cho khớp.

### 30.3. Default plots có thể lệch

`AuthContext` default plots là 3 ô, còn `/api/garden/get` default là 6 ô. Nếu UI vườn kỳ vọng 6 ô, nên đồng bộ hai nơi.

### 30.4. Route `/vachda` chưa thấy page

Homepage có click zone `/vachda`, nhưng codebase hiện chưa có folder page tương ứng. Nếu chưa làm chức năng này, nên ẩn hoặc đổi trạng thái “đang phát triển”.

### 30.5. Encoding tiếng Việt trong một số file

Khi đọc bằng PowerShell, nhiều chuỗi tiếng Việt bị mojibake. Có thể file vẫn chạy bình thường nhưng nên đảm bảo tất cả file lưu UTF-8 để khi nộp hoặc mở trên GitHub hiển thị đúng dấu.

## 31. Tóm tắt luồng chính toàn hệ thống

Luồng người dùng mới:

1. Vào `/`.
2. Sang `/register`.
3. Đăng ký.
4. Xác minh email.
5. Đăng nhập `/login`.
6. Server tạo session cookie.
7. Middleware đưa vào `/survey`.
8. Người dùng đặt tên.
9. Người dùng làm khảo sát ban đầu.
10. Server lưu điểm và set onboarding `done`.
11. Người dùng vào `/homepage`.
12. Người dùng khám phá các khu vực trên đảo.

Luồng người dùng cũ:

1. Vào `/login`.
2. Đăng nhập.
3. Server set onboarding `daily`.
4. Middleware đưa vào `/daily-checkin`.
5. Người dùng chọn vấn đề hôm nay.
6. Nếu thiếu survey topic, chuyển `/survey?topic=...`.
7. Nếu đã có điểm topic, làm mini survey.
8. Server lưu check-in và set onboarding `done`.
9. Người dùng vào `/homepage`.
10. Các hoạt động trên đảo sinh tài nguyên và cập nhật hồ sơ.

Luồng gamification:

1. Survey tạo điểm và rank.
2. Daily check-in cập nhật chủ đề và streak.
3. Cây thần, focus timer, task progress, survey level-up sinh tài nguyên.
4. Hạt giống dùng trồng cây.
5. Cây sinh tinh hoa.
6. Tinh hoa/vàng/lá dùng mua pet.
7. Pet cần chăm sóc định kỳ.
8. ProfileBar và Shop phản ánh toàn bộ tài nguyên hiện tại.

## 32. Kết luận

Đảo Bình Yên được thiết kế như một hệ sinh thái trải nghiệm thay vì một ứng dụng đơn chức năng. Trục chính của hệ thống là **xác thực -> khảo sát -> daily check-in -> bản đồ đảo -> các khu vực tương tác -> cập nhật tài nguyên/trạng thái**.

Mỗi khu vực có một vai trò riêng:

- Survey và Daily Check-in ghi nhận trạng thái tinh thần.
- Homepage đóng vai trò bản đồ điều hướng.
- ProfileBar và Shop là lớp tài nguyên toàn cục.
- Thần Thụ tạo phần thưởng nhanh và thư tương lai.
- Vườn Hoa biến hạt giống thành tinh hoa.
- Trại Thú Cưng tạo vòng chăm sóc dài hạn.
- Nhà Gỗ hỗ trợ thư giãn bằng âm nhạc.
- Hải Đăng hỗ trợ tập trung, quản lý mục tiêu và radio chữa lành.
- Suối Nguồn hỗ trợ tâm sự, nhật ký, chat và video chữa lành.
- Hồ Nước hỗ trợ soi cảm xúc bằng camera và AI nhận diện biểu cảm.

Nhờ các luồng này liên kết với nhau, người dùng có lý do quay lại mỗi ngày, vừa để cập nhật cảm xúc, vừa để chăm sóc khu vườn, thú cưng và hành trình tinh thần của chính mình.
