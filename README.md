# Video Admin Dashboard

Trang quản trị video (Vanilla HTML/CSS/JS + Supabase). Hệ thống **chỉ dành cho tài khoản ADMIN**.

## Chức năng
| Trang | Mô tả |
|---|---|
| `login.html`, `forgot-password.html`, `reset-password.html` | Đăng nhập, quên và đặt lại mật khẩu |
| `index.html` | Dashboard: tổng video, tổng lượt xem, dung lượng; Bar chart top 10; Line chart theo ngày/tháng; video mới |
| `videos.html` | CRUD video, upload thumbnail/video lên Storage, tìm kiếm, lọc danh mục, phân trang |
| `categories.html` | CRUD danh mục |
| `users.html` | Danh sách tài khoản, đổi role, khóa/mở khóa, xóa |

Không có đăng ký công khai. Thêm admin mới: Supabase Dashboard → Authentication → Users → Add user, rồi chạy
`UPDATE public.profiles SET role = 'ADMIN' WHERE email = '<email>';`

## Cấu trúc
```
*.html            các trang
css/              main.css (biến, base, auth) · components.css · dashboard.css
js/config.js      Supabase client (URL + anon key)
js/auth.js        đăng nhập, quên/đặt lại mật khẩu, checkAuth()
js/layout.js      sidebar + header dùng chung
js/dashboard.js · videos.js · categories.js · users.js · utils.js
supabase/setup.sql        schema, trigger, RLS, storage, dữ liệu mẫu (chạy 1 lần)
supabase/hardening.sql    siết quyền chỉ ADMIN + giới hạn bucket (chạy sau setup.sql)
```

## Cài đặt từ đầu
1. Supabase → SQL Editor: chạy `supabase/setup.sql`, rồi `supabase/hardening.sql`.
2. Authentication → Users: tạo user admin (tick Auto Confirm), rồi gán `role = 'ADMIN'` (xem trên).
3. Authentication → Sign In / Providers: tắt **Allow new users to sign up**.
4. Authentication → URL Configuration: thêm URL chạy app vào **Redirect URLs** (cần cho link quên mật khẩu).
5. Điền `SUPABASE_URL` và **anon key** vào `js/config.js` (Project Settings → API). Không dùng `service_role`.
6. Chạy bằng web server tĩnh bất kỳ (ES Modules không chạy qua `file://`), ví dụ:
   `python -m http.server 5500` → mở `http://localhost:5500/login.html`.

## Checklist triển khai production
- [ ] Hosting tĩnh bằng HTTPS (Netlify, Vercel, Cloudflare Pages, Nginx...).
- [ ] Thêm domain production vào Redirect URLs và đặt **Site URL** đúng.
- [ ] Đã chạy `hardening.sql`; kiểm tra Authentication → Policies và Storage → Policies.
- [ ] Tắt đăng ký công khai; xóa tài khoản mẫu / đổi mật khẩu mẫu `123456`.
- [ ] Đặt độ dài mật khẩu tối thiểu ≥ 8–12 ký tự; cân nhắc bật MFA cho admin.
- [ ] Đổi mật khẩu DB đã từng lưu dạng text; không commit `supabase.txt`.
- [ ] Ghim phiên bản CDN (`supabase-js`, `chart.js`) và thêm SRI.
- [ ] Thêm security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`) tại hosting.
- [ ] Bật backup (Supabase → Database → Backups; gói Pro có PITR) và thử khôi phục 1 lần.
- [ ] Cấu hình SMTP riêng cho email xác nhận/khôi phục (SMTP mặc định của Supabase giới hạn tần suất).

## Rollback & sự cố cơ bản
- **Lỗi sau khi deploy frontend**: deploy lại bản trước (hosting tĩnh giữ lịch sử deploy).
- **Lỗi sau khi sửa SQL/RLS**: policy đổi bằng `DROP POLICY ... / CREATE POLICY ...`; luôn backup trước khi chạy script mới.
- **Không đăng nhập được hàng loạt**: kiểm tra `anon key`, trạng thái project Supabase (pause do không hoạt động ở gói free), và cột `profiles.role/is_locked`.
- **Dashboard trống / báo lỗi permission**: kiểm tra user đăng nhập là ADMIN và RLS `is_admin()` hoạt động.
- **Upload lỗi**: file vượt giới hạn bucket (thumbnail 5MB, video 50MB) hoặc sai MIME.

## Ghi chú kỹ thuật
- Mọi dữ liệu người dùng render ra HTML đều qua `escapeHtml()`.
- `views_count` trong `videos` và `video_views` là hai nguồn độc lập (theo `DATABASE.md`); Dashboard cột lấy từ `videos`, đường lấy từ `video_views`.
- Giới hạn 1000 dòng/request của Supabase được xử lý bằng phân trang trong `dashboard.js`.
