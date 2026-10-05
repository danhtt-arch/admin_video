# VIBE CODING STEP-BY-STEP IMPLEMENTATION ROADMAP

Lần lượt đưa từng Task này cho Claude / Cursor AI để sinh code từng phần một cách chính xác nhất.

---

## Task 1: Khởi tạo Project & Cấu hình Supabase
**Prompt cho AI:**
> "Hãy tạo cho tôi file `js/config.js` để khởi tạo Supabase Client từ CDN. Lấy URL và Anon Key từ hằng số cấu hình. Tạo file `js/utils.js` chứa các hàm tiện ích: `formatNumber()`, `formatDate()`, `formatBytes()`, và hàm thông báo `showToast(message, type)`. Tạo file `css/main.css` chứa các biến CSS Variables cho giao diện Light Mode."

---

## Task 2: Trang Auth (Login, Register, Forgot Password)
**Prompt cho AI:**
> "Hãy viết 3 trang HTML + JS hoàn chỉnh:
> 1. `login.html` & `js/auth.js`: Đăng nhập với Email & Password. Khi thành công lưu session và redirect tới `index.html`.
> 2. `register.html`: Đăng ký với Username, Email, Password. Tự động lưu user metadata.
> 3. `forgot-password.html`: Nhập Email gửi mail khôi phục mật khẩu.
> Yêu cầu giao diện Light Mode căn giữa màn hình, thẻ Card trắng, shadow đẹp mắt."

---

## Task 3: Base Layout & Navigation Component
**Prompt cho AI:**
> "Tạo khung Layout chung cho Admin Dashboard (dùng lại ở `index.html`, `videos.html`, `users.html`):
> - Sidebar bên trái: Logo, Menu (Dashboard, Videos, Categories, Users), Profile badge & Logout button.
> - Header bên trên: Tiêu đề trang, Search bar, Profile avatar.
> - Viết hàm `checkAuth()` trong `js/auth.js` để bảo vệ trang, nếu chưa đăng nhập thì redirect về `login.html`."

---

## Task 4: Trang Dashboard (`index.html`) & Biểu Đồ Chart.js
**Prompt cho AI:**
> "Hãy hoàn thiện `index.html` và `js/dashboard.js`:
> 1. Lấy dữ liệu từ Supabase fill vào 3 Card: Tổng số video, Tổng lượt xem (SUM views_count), Dung lượng Storage (SUM storage_size_mb).
> 2. Dùng Chart.js tạo **Biểu đồ Cột (Bar Chart)**: Hiển thị 10 video có lượt xem cao nhất.
> 3. Dùng Chart.js tạo **Biểu đồ Đường (Line Chart)**: Hiển thị tổng lượt xem theo ngày từ bảng `video_views`.
> Giao diện tông màu sáng thanh lịch, màu biểu đồ match màu Primary Blue `#2563EB`."

---

## Task 5: Trang Quản lý Video (`videos.html`) - CRUD & Storage
**Prompt cho AI:**
> "Viết trang `videos.html` và `js/videos.js` quản lý Video:
> 1. Hiển thị bảng danh sách video với các cột: ID, Thumbnail (image preview), Tiêu đề, Danh mục, Dung lượng, Lượt xem, Thao tác (Edit, Delete).
> 2. Modal **Thêm mới Video**: Cho phép nhập thông tin và Upload file Thumbnail lên Supabase Storage bucket `thumbnails`.
> 3. Modal **Sửa Video**: Cập nhật thông tin bản ghi.
> 4. Chức năng **Xóa Video**: Xác nhận xóa và xóa bản ghi DB kèm file trên Storage."

---

## Task 6: Trang Quản lý User (`users.html`) & Phân Quyền ADMIN
**Prompt cho AI:**
> "Viết trang `users.html` và `js/users.js`:
> 1. Hiển thị danh sách người dùng từ bảng `profiles`: ID, Username, Email, Role (`ADMIN` / `USER`), Ngày đăng ký.
> 2. Kiểm tra nếu user hiện tại KHÔNG PHẢI là `ADMIN` thì không cho phép vào trang này (redirect về Dashboard hoặc báo lỗi).
> 3. Cho phép Admin thay đổi Role của user khác."