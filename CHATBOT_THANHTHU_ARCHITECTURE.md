# Chatbot Bot Tam Su va Than Thu - Architecture Notes

Tai lieu nay mo ta cach project dang lam hai phan:

- Chatbot "Bot tam su" trong `suoinguon`.
- Khu `thanthu`: rung cay Than Thu va hom thu tuong lai.

File nay chi la tai lieu ky thuat, khong thay doi logic chay cua app.

## 1. Tong Quan Stack

Project la Next.js App Router.

- Frontend: React client components trong `src/app/.../page.tsx` va modal components.
- Backend: Next API routes trong `src/app/api/.../route.ts`.
- Auth: Firebase Auth session cookie, verify bang Firebase Admin.
- Database: Cloud Firestore.
- AI: Gemini REST API qua route server-side `/api/gemini-chat`.

Firebase co 2 lop SDK:

- Client SDK: `src/app/lib/firebase.ts`
  - Dung trong browser.
  - Dang export `app`, `auth`, `db`.
  - Chatbot bot history hien dang ghi truc tiep bang client Firestore SDK.

- Admin SDK: `src/app/lib/firebaseAdmin.js`
  - Dung trong API routes.
  - Doc env `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
  - Dung cho mailbox, shake reward, user info, auth session verify.

## 2. Chatbot Bot Tam Su

### File Chinh

- UI va flow: `project_daobinhyen/src/app/suoinguon/components/modals/GocTroChuyen.tsx`
- Gemini API route: `project_daobinhyen/src/app/api/gemini-chat/route.ts`
- Style chat: `project_daobinhyen/src/app/suoinguon/StreamArea.css`

### UI Flow

Trong `GocTroChuyen`, man hinh dau co 2 option:

- `Bot tam su`
- `Ghep voi nguoi la`

Hai option dung chung khung chat go:

- Header hien avatar, ten nguoi chat, status.
- Body hien danh sach `chatMessages`.
- Footer co input va nut gui.

Khi vao bot:

1. User bam `Bot tam su`.
2. `handleStartBotChat()` chay.
3. Component reset `currentRoomId`, `waitingTicketId`.
4. Goi `loadLatestBotSession()`.
5. Neu co session cu, load 20 tin gan nhat tu Firestore.
6. Neu chua co session, tao session moi va tin welcome.
7. Chuyen `chatMode` sang `botChatting`.

Khi gui tin cho bot:

1. `handleSendMessage()` bat submit form.
2. Neu `chatMode === "botChatting"` thi goi `handleSendBotMessage(messageText)`.
3. Tao message user local:
   - `sender: "me"`
   - `text: messageText`
   - `timestamp: new Date()`
4. Cap nhat UI bang `setChatMessages(history)`.
5. Luu message user vao Firestore qua `saveBotMessage()`.
6. Goi `/api/gemini-chat` voi:
   - `message`
   - `history`: 20 tin gan nhat, map thanh role `user` hoac `model`.
7. Nhan `data.reply`.
8. Them reply vao UI voi `sender: "stranger"`.
9. Luu reply bot vao Firestore voi `sender: "bot"`.

### Database Chatbot

Duong dan Firestore:

```text
users/{uid}/bot_chats/{sessionId}
  summary: string
  createdAt: Timestamp
  updatedAt: Timestamp

users/{uid}/bot_chats/{sessionId}/messages/{messageId}
  sender: "me" | "bot"
  text: string
  createdAt: Timestamp
```

Mapping UI:

```text
Firestore sender "me"  -> UI sender "me"
Firestore sender "bot" -> UI sender "stranger"
```

Ly do dung `stranger` trong UI: CSS hien tai da style bong chat doi phuong bang class `.chat-message-row.stranger`.

### Gemini Route Flow

Route: `/api/gemini-chat`.

Input body:

```json
{
  "message": "noi dung user vua gui",
  "history": [
    { "role": "user", "text": "..." },
    { "role": "model", "text": "..." }
  ]
}
```

Route xu ly:

1. Doc `GEMINI_API_KEY`.
2. Doc `GEMINI_MODEL`, fallback `gemini-3-flash-preview`.
3. Validate `message`.
4. Chuan hoa `history` trong `normalizeHistory()`.
5. Cat context con 20 tin gan nhat.
6. Goi Gemini REST:

```text
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
```

Body gom:

- `systemInstruction`
- `contents`
- `generationConfig`

Config hien tai:

```ts
temperature: 0.6
topP: 0.85
maxOutputTokens: 1024
thinkingConfig: { thinkingBudget: 0 }
```

Route co lop clean output:

- Chan response dang `Source:`, citation, markdown code block.
- Neu Gemini tra cau bi cut hoac `finishReason === "MAX_TOKENS"` thi tra fallback hoan chinh.

### Dieu Quan Trong Ve History

Gemini API khong tu nho history giua cac request. App phai tu gui context moi lan goi.

Project hien tai dang:

- Luu tin nhan bot vao Firestore.
- Khi mo lai bot, load 20 tin gan nhat.
- Khi goi Gemini, gui 20 tin gan nhat.

Neu can nho dai han hon, nen them `summary`:

```text
users/{uid}/bot_chats/{sessionId}.summary
```

Sau moi vai tin, backend co the tom tat cau chuyen va cap nhat `summary`, sau do gui `summary + last 20 messages` len Gemini.

## 3. Chat Voi Nguoi La

Van nam trong `GocTroChuyen.tsx`, nhung flow rieng voi bot.

### Flow Ghep Nguoi La

1. User bam `Ghep voi nguoi la`.
2. `handleStartMatching()` yeu cau user dang nhap.
3. Goi `/api/user/getUserInFo?uid=${user.uid}` de lay:
   - username
   - lastSurveyScore
4. Goi `/api/match`.
5. Neu matched:
   - set `currentRoomId`
   - set `strangerInfo`
   - goi `enterChatRoom(roomId)`
6. Neu chua matched:
   - luu `waitingTicketId`
   - listen Firestore `waiting_room/{waitingTicketId}`
   - khi ticket status `matched`, vao room.

### Database Nguoi La

Chat room:

```text
chat_rooms/{roomId}
  status
  participants
  ...

chat_rooms/{roomId}/messages/{messageId}
  text
  senderId
  timestamp
```

Hang doi:

```text
waiting_room/{waitingTicketId}
  status
  roomId
  matchedWithName
  matchedWithScore
  ...
```

### Gui Tin Nguoi La

Frontend goi:

```text
POST /api/send
```

Body:

```json
{
  "roomId": "...",
  "text": "...",
  "senderId": "uid"
}
```

Sau do client listen realtime:

```text
chat_rooms/{roomId}/messages orderBy timestamp asc
```

## 4. Than Thu

### File Chinh

- UI: `project_daobinhyen/src/app/thanthu/page.tsx`
- Rung cay: `project_daobinhyen/src/app/api/user/leaves/shake/route.ts`
- Gui thu: `project_daobinhyen/src/app/api/user/mailbox/send/route.ts`
- Inbox: `project_daobinhyen/src/app/api/user/mailbox/inbox/route.ts`
- Mark read: `project_daobinhyen/src/app/api/user/mailbox/read/route.ts`
- Delete: `project_daobinhyen/src/app/api/user/mailbox/delete/route.ts`
- Time background: `project_daobinhyen/src/app/api/auth/time/route.ts`

### Than Thu UI Flow

Trang `thanthu/page.tsx` co 2 vung click chinh:

- Cay Than Thu: click de rung cay nhan reward.
- Hom Thu Tuong Lai: click de mo modal viet/doc thu.

Nen theo gio:

1. `useEffect` goi `/api/auth/time`.
2. Lay `hour`.
3. Chon anh nen:
   - 5-6: binh minh
   - 16-18: hoang hon
   - 18-22: toi
   - 22-5: khuya
   - con lai: ngay
4. Neu API fail, fallback gio may local.

### Flow Rung Cay

Frontend:

1. User click vung cay.
2. `handleShake()` set `isShaking`.
3. Goi:

```text
POST /api/user/leaves/shake
```

4. Backend xac thuc session cookie.
5. Random reward:
   - 60% leaf, amount 1-3
   - 30% coin, amount 5-20
   - 10% seed, amount 1
6. Map field:
   - leaf -> `users/{uid}.leaves`
   - coin -> `users/{uid}.money`
   - seed -> `users/{uid}.seeds`
7. Update bang `FieldValue.increment(amount)`.
8. Frontend hien particle va alert.
9. Dispatch event `userDataUpdated` de ProfileBar refresh.

Database:

```text
users/{uid}
  leaves: number
  money: number
  seeds: number
```

### Flow Hom Thu Tuong Lai

Modal co 2 tab:

- `write`
- `inbox`

#### Gui Thu

Frontend:

1. User viet `mailContent`.
2. Click `Niem Phong`.
3. Goi:

```text
POST /api/user/mailbox/send
```

Body:

```json
{
  "content": "noi dung thu"
}
```

Backend:

1. Xac thuc session cookie.
2. Validate content:
   - khong rong
   - toi da 2000 ky tu
3. Tao `deliver_at`.
4. Add document:

```text
mailbox/{uid}/letters/{letterId}
  content: string
  sent_at: Timestamp
  deliver_at: Timestamp
  is_read: false
  status: "pending"
```

#### Inbox

Frontend:

1. User chuyen tab `inbox`, goi `fetchInbox()`.
2. Goi:

```text
GET /api/user/mailbox/inbox
```

Backend:

1. Xac thuc session cookie.
2. Lay `now = Timestamp.now()`.
3. Tim thu `pending` ma `deliver_at <= now`.
4. Batch update thanh:

```text
status: "delivered"
is_read: false
```

5. Query cac thu:

```text
where status in ["delivered", "read"]
orderBy deliver_at desc
```

6. Tra ve letters cho frontend.

#### Doc Thu

Frontend:

1. User click letter.
2. Set selected letter.
3. Neu chua doc, goi:

```text
POST /api/user/mailbox/read
```

Body:

```json
{
  "letterId": "..."
}
```

Backend:

1. Xac thuc session cookie.
2. Chi doc trong `mailbox/{uid}/letters/{letterId}`.
3. Neu `status === "pending"`, tra 403.
4. Neu hop le, update:

```text
is_read: true
status: "read"
```

#### Xoa Thu

Frontend:

1. User bam icon delete.
2. Confirm.
3. Goi:

```text
DELETE /api/user/mailbox/delete
```

Body:

```json
{
  "mailId": "..."
}
```

Backend:

1. Xac thuc session cookie.
2. Kiem tra thu ton tai trong mailbox cua chinh uid.
3. Delete document.

## 5. Bug / Risk Scan

### 5.1 Encoding tieng Viet bi loi mojibake

Trong nhieu file hien dang co chu bi hien thi dang:

```text
Báº¡n Suá»‘i Nguá»“n
NgÆ°á»i láº¡
```

Rui ro:

- UI hien chu loi dau tieng Viet.
- Prompt / fallback text gui Gemini bi xau.
- Alert nguoi dung kho doc.

Huong fix:

- Chuan hoa file ve UTF-8.
- Sua text user-facing trong cac file dang mojibake.
- Dung editor luu UTF-8 khong BOM.

### 5.2 Chatbot co the khong luu neu user chua dang nhap

`saveBotMessage()` return neu khong co `user?.uid`.

Hien tai `loadLatestBotSession()` neu khong co user se show alert va return null, nhung `handleStartBotChat()` van co fallback set local welcome va vao bot chat.

Rui ro:

- User khong dang nhap van chat duoc voi bot.
- History khong luu Firestore.
- Reload la mat chat.

Huong fix:

- Neu khong dang nhap thi dung flow, khong vao `botChatting`.
- Hoac cho phep guest chat nhung luu localStorage rieng.

### 5.3 Firestore rules co the chan client ghi bot history

Chatbot bot history dang ghi bang client SDK vao:

```text
users/{uid}/bot_chats/{sessionId}
```

Neu Firestore rules khong cho user ghi vao path nay, se bi `permission-denied`.

Huong fix:

- Them rules chi cho user doc/ghi path cua chinh minh.
- Hoac chuyen save history sang API route server-side dung Admin SDK.

Rule goi y:

```text
match /users/{userId}/bot_chats/{sessionId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  match /messages/{messageId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```

### 5.4 Tao session moi co the tao welcome duplicate trong vai case

`createBotSession()` tao session, luu welcome, set state.

Rui ro thap:

- Neu user bam lien tuc hoac request bi retry, co the tao nhieu session moi.

Huong fix:

- Disable nut Bot tam su trong luc loading.
- Them state `isLoadingBotHistory`.

### 5.5 Bot history load 20 tin, chua co summary dai han

Hien tai bot chi gui 20 tin gan nhat vao Gemini.

Rui ro:

- Cau chuyen dai hon 20 tin se mat chi tiet cu.
- Bot co the quen context xa.

Huong fix:

- Dung field `summary` trong `bot_chats`.
- Sau moi 6-10 tin, goi API tom tat va update summary.
- Khi goi Gemini, gui `summary + last 20 messages`.

### 5.6 Gemini quota / key pool chua co

Route hien chi doc:

```text
GEMINI_API_KEY
GEMINI_MODEL
```

Rui ro:

- Neu key het quota, chat bot loi ngay.
- Chua co fallback qua key khac.

Huong fix:

- Them `GEMINI_API_KEYS=key1,key2,key3`.
- Route retry qua key tiep theo khi gap 429/quota exceeded.
- Luu y: nhieu key cung mot Google Cloud project co the van chung quota.

### 5.7 `thinkingConfig` co the khong hop voi mot so model

Route dang gui:

```ts
thinkingConfig: { thinkingBudget: 0 }
```

Rui ro:

- Neu model/API version khong chap nhan field nay, Gemini co the tra 400.

Huong fix:

- Neu gap 400 do `thinkingConfig`, retry mot lan khong co `thinkingConfig`.
- Hoac cau hinh theo model.

### 5.8 `/api/auth/time` phu thuoc external API

Than Thu goi `timeapi.io`.

Rui ro:

- Mat mang/DNS fail thi route 500.
- Frontend co fallback local time nen UI van co nen, nhung server log co loi.

Huong fix:

- Trong route server fallback local Asia/Ho_Chi_Minh thay vi tra 500.

### 5.9 Firebase Admin verifySessionCookie voi `checkRevoked = true` can goi Google

Nhieu API dung:

```ts
auth.verifySessionCookie(sessionCookie, true)
```

Rui ro:

- Neu local/DNS khong resolve duoc `identitytoolkit.googleapis.com`, API auth fail 401/500.
- Da tung thay log `getaddrinfo ENOTFOUND identitytoolkit.googleapis.com`.

Huong fix:

- Khi dev local co the dung `false` cho mot so route it nhay cam.
- Hoac bat mang/DNS on dinh.
- Bat loi network rieng de message ro hon.

### 5.10 Mailbox UI noi 24 gio nhung backend giao sau 10 giay

Trong `thanthu/page.tsx`, UI ghi:

```text
Thoi gian nhan: 24 GIO SAU
```

Nhung `send/route.ts` dang:

```ts
deliverAt.setSeconds(deliverAt.getSeconds() + 10);
```

Rui ro:

- User thay noi 24h nhung thu den sau 10 giay.

Huong fix:

- Neu demo: sua UI thanh "10 giay sau".
- Neu production: sua backend thanh `deliverAt.setHours(deliverAt.getHours() + 24)`.

### 5.11 Mailbox query co the can composite index

Inbox query:

```text
where status in ["delivered", "read"]
orderBy deliver_at desc
```

Rui ro:

- Firestore co the yeu cau composite index.

Huong fix:

- Neu console bao loi index, bam link Firestore tao index tu error.

### 5.12 Rung cay khong co cooldown server-side

Frontend co `isShaking` de chan click nhanh, nhung backend `/api/user/leaves/shake` khong co cooldown.

Rui ro:

- User co the spam request truc tiep de farm reward.

Huong fix:

- Luu `lastShakeAt` trong `users/{uid}`.
- Backend check cooldown truoc khi reward.
- Dung transaction de tranh race condition.

### 5.13 Rung cay update user doc co the fail neu user doc chua ton tai

Backend dung:

```ts
userRef.update({ [field]: FieldValue.increment(amount) })
```

Rui ro:

- Neu `users/{uid}` chua ton tai, update fail.

Huong fix:

- Dung `set(..., { merge: true })` hoac tao user doc luc register.

### 5.14 Xoa thu la hard delete

API delete xoa thang document.

Rui ro:

- Khong khoi phuc duoc.
- Kho audit neu user bao mat thu.

Huong fix:

- Dung soft delete:

```text
status: "deleted"
deleted_at: Timestamp
```

### 5.15 Text trong bot welcome hien dang dung ASCII khong dau

`BOT_WELCOME_MESSAGE` hien dang la ASCII de tranh loi encoding:

```text
Minh o day de lang nghe ban...
```

Rui ro:

- UI bot chua dep vi khong co dau tieng Viet.

Huong fix:

- Sau khi chuan hoa encoding file UTF-8, doi lai text co dau.

## 6. De Xuat Nang Cap Tiep Theo

Uu tien cao:

1. Chuan hoa encoding tieng Viet cho cac file UI/API.
2. Them Firestore rules cho `users/{uid}/bot_chats`.
3. Them key pool cho Gemini.
4. Them cooldown server-side cho rung cay.
5. Dong bo thoi gian hom thu: 10 giay demo hoac 24 gio production.

Uu tien trung binh:

1. Luu `summary` chatbot va gui len Gemini.
2. Chuyen bot history write sang API route Admin SDK de rules don gian hon.
3. Them loading state khi mo bot history.
4. Them soft delete cho mailbox.

Uu tien sau:

1. Tao UI quan ly nhieu bot sessions.
2. Them nut "bat dau cuoc tro chuyen moi".
3. Them export/xoa lich su bot theo yeu cau nguoi dung.
