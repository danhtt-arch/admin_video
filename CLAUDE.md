# PROJECT GUIDELINES: VIDEO ADMIN DASHBOARD (VIBE CODING)

## 1. Project Overview
Project web app quản lý video dạng Admin Dashboard dành cho hệ thống Vibe Coding.
- **Mục tiêu**: Xây dựng trang quản trị video với đầy đủ tính năng CRUD, Dashboard phân tích, xác thực người dùng và phân quyền (ADMIN / USER).
- **Ngôn ngữ & Công nghệ**: Pure HTML5, CSS3 (Vanilla CSS with CSS Variables), JavaScript (ES6 Modules).
- **Backend Services**: Supabase (Database Postgres, Auth, Storage).
- **Thư viện phụ trợ**: Chart.js (vẽ biểu đồ), FontAwesome / Lucide Icons (Icon set via CDN), Supabase JS SDK (`@supabase/supabase-js`).
- **Giao diện**: Light Mode (Tông màu sáng, nền trắng `#FFFFFF` / xám nhạt `#F8FAFC`).

---

## 2. Directory Structure
```
video-admin-dashboard/
├── index.html              # Trang Dashboard chính
├── login.html              # Trang Đăng nhập
├── register.html           # Trang Đăng ký
├── forgot-password.html    # Trang Quên mật khẩu
├── videos.html             # Trang Danh sách & Quản lý Video
├── users.html              # Trang Quản lý Người dùng
├── categories.html         # Trang Quản lý Danh mục Video
├── css/
│   ├── main.css            # Stylesheet chung, CSS Variables, Reset
│   ├── components.css      # Sidebar, Header, Cards, Modals, Tables, Forms
│   └── dashboard.css       # Layout riêng cho Dashboard & Charts
├── js/
│   ├── config.js           # Supabase client initialization & API Keys
│   ├── auth.js             # Logic Đăng nhập, Đăng ký, Quên mật khẩu, Auth Guards
│   ├── dashboard.js        # Logic lấy dữ liệu v thống kê & vẽ Chart.js
│   ├── videos.js           # CRUD Video, Upload Thumbnail / Video lên Storage
│   ├── users.js            # Quản lý danh sách User & phân quyền ADMIN
│   └── utils.js            # Helper functions (format date, format views, byte conversion)
└── assets/
    └── images/             # Placeholder images & logos
```

---

## 3. Strict Coding Rules for Claude / AI Assistant
1. **NO Heavy Frameworks**: Không sử dụng React, Vue, Angular, Tailwind CSS CLI, hay jQuery. Chỉ dùng Vanilla HTML/CSS/JS.
2. **Supabase Integration**: Sử dụng CDN client:
   `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
3. **Chart.js Integration**: Sử dụng Chart.js v4 via CDN:
   `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`
4. **Light Mode Only**: 
   - Primary Background: `#F8FAFC`
   - Card Background: `#FFFFFF`
   - Primary Text: `#0F172A`
   - Border Color: `#E2E8F0`
   - Brand Color: `#2563EB` (Royal Blue)
5. **Modular Architecture**:
   - Sử dụng `type="module"` trong thẻ `<script>` để phân tách hàm rõ ràng.
   - Luôn kiểm tra Auth state (`checkAuth()`) trước khi render các trang bảo mật.
6. **Error Handling & UX**:
   - Mọi thao tác async phải có `try...catch` và hiển thị thông báo toast/alert cho người dùng.
   - Thêm trạng thái Loading (spinner) khi đang fetch dữ liệu.