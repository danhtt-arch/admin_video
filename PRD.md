# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Mục tiêu Sản phẩm
Hệ thống Admin Dashboard phục vụ việc quản lý video, thống kê lượt xem, dung lượng bộ nhớ, và phân quyền người dùng đơn giản, trực quan, tối ưu cho giao diện sáng (Light Mode).

---

## 2. Yêu cầu Chức năng theo Trang

### 2.1. Trang Dashboard (`index.html`)
- **Metric Cards (Thống kê tổng quan)**:
  1. **Tổng số video**: Đếm số bản ghi trong bảng `videos`.
  2. **Tổng lượt xem**: Tổng số `views_count` của tất cả video.
  3. **Dung lượng storage**: Tổng dung lượng (MB/GB) video đã lưu trữ trên Supabase Storage.
- **Charts (Biểu đồ thống kê)**:
  1. **Biểu đồ cột (Bar Chart)**: Hiển thị Top 10 video có lượt xem cao nhất (`title` vs `views_count`).
  2. **Biểu đồ đường (Line Chart)**: Lượt xem theo ngày / tháng (truy vấn từ bảng `video_views`).
- **Activity Feed**: Lịch sử video mới tải lên gần đây.

### 2.2. Trang Quản lý Video (`videos.html`)
- **Bảng Danh sách Video**:
  - Các cột: `ID`, `Thumbnail` (ảnh xem trước), `Title` (Tên video), `Category` (Danh mục), `Storage Size`, `Views` (Lượt xem), `Actions` (Sửa, Xóa).
  - Thanh tìm kiếm theo tên video và lọc theo danh mục.
  - Phân trang (Pagination) hoặc Lazy Loading.
- **Modal Thêm / Chỉnh sửa Video**:
  - Input: Tiêu đề, Mô tả, Danh mục, File Thumbnail (Upload Supabase Storage), URL Video hoặc Upload File Video.
- **Xóa Video**: Confirmation Modal trước khi xóa dữ liệu DB và xóa file trên Storage.

### 2.3. Trang Quản lý User (`users.html`) - Chỉ dành cho Role ADMIN
- **Danh sách người dùng**: ID, Username, Email, Role (`ADMIN` / `USER`), Ngày tạo.
- **Thao tác**: Đổi vai trò (Assign Role), Khóa account / Xóa user.

### 2.4. Trùm trang Auth (`login.html`, `register.html`, `forgot-password.html`)
- **Login (`login.html`)**:
  - Input: Email, Password.
  - Redirect đến `index.html` nếu đăng nhập thành công.
- **Register (`register.html`)**:
  - Input: Username, Email, Password, Confirm Password.
  - Tự động gán role mặc định `USER` vào bảng `profiles`.
- **Forgot Password (`forgot-password.html`)**:
  - Input: Email.
  - Gửi email reset password qua Supabase Auth.

---

## 3. Phân Quyền Nguời Dùng (RBAC)
- **ADMIN**: Xem Dashboard, CRUD Video, CRUD Category, Quản lý User.
- **USER**: Xem Dashboard, Xem danh sách video (Chỉ sửa/xóa video do chính mình tạo ra nếu mở rộng).