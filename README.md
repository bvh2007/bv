# Sorry Bloom 3D — Fullstack (Node.js / Express / MySQL / Cloudinary)

Dự án **không tự viết lời xin lỗi**. Tất cả nội dung được điền trong trang `/admin` sau khi đăng nhập. Website có 7 chương trên trang chính và trang `/gift` riêng.

## 1. Cấu trúc

```
sorry-bloom-3d/
├── backend/app.js, db.js, server.js
├── frontend/index.html, gift.html, admin.html
├── frontend/css/style.css
├── frontend/js/main.js (source), bundle.js (build tạo)
├── scripts/build.js, create-admin.js
├── sql/schema.sql
├── .env.example, .gitignore, package.json, render.yaml
└── README.md
```

## 2. Chuẩn bị

Cài Node.js LTS (>=20), Git, VS Code. Cần **MySQL 8+** (local hoặc cloud), một tài khoản **Cloudinary** để lưu ảnh authenticated. Không đưa ảnh riêng tư lên hệ thống khi chưa được người trong ảnh đồng ý.

**Lưu ý quyền riêng tư:** Ảnh được lưu private/authenticated ở Cloudinary và proxy qua Express. Tuy nhiên endpoint `/api/photos/:id/image` cho phép **bất cứ ai biết URL website** xem 5 ảnh; đây là cơ chế cấp quyền công khai cho người nhận. Nếu cần chỉ người được mời xem, phải bổ sung đăng nhập người nhận / token mời trước khi upload ảnh nhạy cảm. Không có cách đảm bảo người xem không chụp màn hình.

## 3. Cài đặt và chạy VS Code

1. Giải nén, mở **đúng thư mục `sorry-bloom-3d`** bằng VS Code. Chạy `dir` hoặc `ls` để chắc chắn có `package.json`, `backend`, `frontend`.
2. Chạy `npm install`.
3. Sao chép `.env.example` thành `.env` (PowerShell: `Copy-Item .env.example .env`). Điền DATABASE_URL, SESSION_SECRET (ít nhất 32 ký tự ngẫu nhiên), CLOUDINARY_*; nếu MySQL local không dùng SSL thì `DB_SSL=false`.
4. Tạo database trong MySQL (ví dụ `CREATE DATABASE sorry_bloom CHARACTER SET utf8mb4;`). Chạy `sql/schema.sql` bằng MySQL Workbench hoặc CLI: `mysql -u root -p sorry_bloom < sql/schema.sql` (dòng này phù hợp cmd/bash; PowerShell nên dùng Workbench).
5. Tạo admin: `node scripts/create-admin.js admin@example.com "YOUR_STRONG_PASSWORD_12_CHARS"` (thay bằng email và mật khẩu thật, đừng commit mật khẩu). Có thể đặt password vào shell history; tránh chia sẻ terminal history.
6. `npm run build` (tạo bundle chứa Three.js + GSAP).
7. `npm start` hoặc `npm run dev`. Mở `http://localhost:3000`, `http://localhost:3000/gift`, `http://localhost:3000/admin`, `http://localhost:3000/api/health`.
8. Vào `/admin` để tự viết lời chào, ba đoạn thư, ba điều nhận ra, lời kết, danh sách click words, tiêu đề/lời nhắn ảnh; upload đúng 5 ảnh JPEG/PNG/WebP dưới 5 MB.

## 4. API

| Method | Route | Quyền |
|---|---|---|
| GET | `/api/health` | công khai |
| GET | `/api/message` | công khai |
| GET | `/api/photos` | công khai, metadata |
| GET | `/api/photos/:id/image` | công khai cho người có link website; proxy ảnh |
| POST | `/api/replies` | công khai, rate limit, 1–1000 ký tự |
| POST | `/api/admin/login` | mật khẩu admin |
| GET | `/api/admin/me` | kiểm tra phiên |
| POST | `/api/admin/logout` | admin |
| PUT | `/api/admin/content` | admin |
| GET | `/api/admin/replies` | admin |
| PUT | `/api/admin/photos/:id` | admin |
| POST | `/api/admin/photos/:id/upload` | admin, multipart/form-data field `photo` |

Phiên đăng nhập lưu trong MySQL, cookie httpOnly, sameSite=lax, secure trên HTTPS; password bcrypt; các API thay đổi dữ liệu yêu cầu Origin trùng host. Nên bổ sung CSRF token và CSP chặt hơn trước khi sử dụng ở môi trường nhạy cảm. Rate limiting mặc định dùng bộ nhớ từng tiến trình, phù hợp một instance nhỏ; khi mở rộng nhiều instance nên dùng Redis.

## 5. GitHub — tránh lỗi chỉ push backend

**Tạo repository GitHub mới và để trống**, ví dụ `sorry-bloom-3d`. Không `git init` bên trong backend. Mở Terminal tại thư mục có package.json.

```bash
git init
git add .
git status
git commit -m "feat: sorry bloom 3d fullstack"
git branch -M main
git remote add origin https://github.com/USERNAME/sorry-bloom-3d.git
git push -u origin main
```

Nếu remote đã tồn tại: `git remote -v`, sau đó `git remote set-url origin URL` khi thật sự muốn đổi. Nếu `git ls-files --stage backend` có mã `160000` nghĩa là backend đang là submodule; không push vội, cần xử lý Git lồng. **Không dùng `git push --force` để sửa lỗi.** Cập nhật sau này: `git add . && git commit -m "update website" && git push`.

`.gitignore` đã loại `.env` và `node_modules`. Kiểm tra `git status` trước mỗi commit để không lộ bí mật.

## 6. Render và MySQL cloud

1. Tạo MySQL 8 cloud (ví dụ dịch vụ có hỗ trợ MySQL). Tạo database, chạy `sql/schema.sql` bằng công cụ của nhà cung cấp. Kiểm tra nhà cung cấp hỗ trợ TLS, IP access và giới hạn kết nối.
2. Render → New → Web Service → Connect GitHub → chọn repository mới.
3. Branch `main`; **Root Directory để trống** nếu `package.json` ở gốc.
4. Build Command: `npm ci && npm run build` (nếu repository chưa có package-lock.json, lần đầu dùng `npm install && npm run build`, rồi commit package-lock.json để chuyển lại `npm ci`). Start Command: `npm start`.
5. Environment: `NODE_ENV=production`, `TRUST_PROXY=1`, `DATABASE_URL=mysql://...`, `DB_SSL=true` (tùy nhà cung cấp), `SESSION_SECRET` chuỗi ngẫu nhiên, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
6. Tạo admin bằng cách chạy script **trên máy tính cá nhân** kết nối cùng MySQL cloud: `node scripts/create-admin.js EMAIL PASSWORD`. Không cần chạy shell trên Render.
7. Deploy → chờ trạng thái Live → kiểm tra URL HTTPS, `/api/health`, `/gift`, `/admin`, lưu nội dung, upload ảnh, thử phản hồi.
8. Auto deploy trên Render khi push `main` (kiểm tra Settings → Auto Deploy).

**Quan trọng:** Render filesystem không bền vững; ảnh lưu Cloudinary và dữ liệu lưu MySQL cloud. Không lưu ảnh vào `frontend/assets` nếu muốn giới hạn truy cập. Nếu nhà cung cấp MySQL yêu cầu chứng chỉ CA riêng, cấu hình SSL theo hướng dẫn của họ; không tắt kiểm tra chứng chỉ trong production.

## 7. Kiểm thử

- Desktop Chrome/Edge: mở thư, chạm nền hiện chữ, 3 thẻ, lời cuối, gửi phản hồi, mở quà, kéo góc nhìn, mở ảnh và chuyển trước/sau.
- Mobile: DevTools responsive 390×844 và 360×800; carousel vuốt ngang, modal ảnh vừa màn hình.
- Bật reduced motion trong hệ điều hành hoặc tắt chuyển động ở website; gallery vẫn dùng được ở chế độ 2D.
- Thử không có ảnh: khung placeholder. Thử ảnh quá 5 MB / file không phải ảnh: API từ chối.
- Thử API admin khi chưa đăng nhập: 401. Thử gửi phản hồi quá dài: 400. Thử gửi nhiều lần: 429.
- Kiểm tra ảnh không xuất hiện trong GitHub hoặc thư mục public.

## 8. Lỗi thường gặp

- `Cannot find module`: chạy `npm install` trong thư mục gốc.
- `Cannot find module backend/server.js` trên Render: kiểm tra GitHub có `backend/server.js` thật, không phải submodule.
- `ENOENT package.json`: kiểm tra Root Directory và file trên GitHub.
- `ER_ACCESS_DENIED_ERROR`: kiểm tra DATABASE_URL / quyền MySQL.
- `ECONNREFUSED`: kiểm tra firewall, host/port DB, TLS.
- `401` ở `/api/admin`: chưa đăng nhập hoặc phiên hết hạn.
- `403 Origin required`: API POST/PUT phải gọi từ trang website cùng origin (không phải cURL mặc định).
- `502` khi tải ảnh: kiểm tra Cloudinary authenticated media, tài khoản và cấu hình.
- Trái tim 3D không hiển thị: thiết bị không hỗ trợ WebGL, chế độ giảm chuyển động, hoặc driver GPU; gallery 2D vẫn hoạt động.

## 9. Những điểm cần hiểu trước khi dùng thật

- Trang quản trị không có chức năng tạo admin công khai; tạo admin bằng script.
- Dự án không theo dõi lượt xem, không ép phản hồi, không tự động phát nhạc.
- Nội dung chỉ hiển thị sau khi bạn tự viết và lưu. Không có lời xin lỗi tự tạo.
- Đây là bản triển khai mẫu cần kiểm thử thực tế trên môi trường MySQL/Cloudinary của bạn trước khi chia sẻ công khai.
