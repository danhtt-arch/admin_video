# LIGHT MODE DESIGN SYSTEM & CSS SPECIFICATION

## 1. Bảng Màu (Color Palette) - Clean Light Mode
```css
:root {
  /* Colors */
  --bg-body: #f8fafc;        /* Nền trang nhạt (Slate 50) */
  --bg-card: #ffffff;        /* Nền Card & Modal trắng tinh */
  --bg-sidebar: #ffffff;     /* Nền Sidebar */
  --bg-header: #ffffff;      /* Nền Header */
  
  --text-main: #0f172a;      /* Chữ chính (Slate 900) */
  --text-muted: #64748b;     /* Chữ phụ (Slate 500) */
  --text-light: #94a3b8;     /* Chữ mờ (Slate 400) */

  --primary: #2563eb;        /* Xanh dương chủ đạo (Blue 600) */
  --primary-hover: #1d4ed8;  /* Blue 700 */
  --primary-light: #eff6ff;  /* Blue 50 (Highlight background) */

  --success: #10b981;        /* Xanh lá (Emerald 500) */
  --warning: #f59e0b;        /* Cam/Vàng (Amber 500) */
  --danger: #ef4444;         /* Đỏ (Red 500) */
  
  --border-color: #e2e8f0;   /* Viền xám nhạt (Slate 200) */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}
```

---

## 2. Layout Structure
- **Sidebar**: Bên trái, cố định (Width: 260px). Chứa Logo, danh sách Menu links (Dashboard, Videos, Categories, Users), thông tin user đăng nhập ở bottom.
- **Header**: Trên cùng, cố định (Height: 64px). Chứa Search bar, Notification bell, User Avatar, Nút Logout.
- **Main Content Area**: Nền `#F8FAFC`, chứa các Stat Cards, Charts, hoặc Tables.

---

## 3. UI Components Code Guidelines

### Metric Card (Thống kê)
- Background: `#FFFFFF`
- Border: `1px solid var(--border-color)`
- Shadow: `var(--shadow-sm)`
- Icon đi kèm background màu pastel nhạt tương ứng.

### Data Table (Danh sách Video/Users)
- Header table (`<thead>`): Nền `#F8FAFC`, chữ viết hoa, font-weight 600.
- Alternate rows: Border bottom `1px solid var(--border-color)`.
- Action Buttons: Icon edit (Blue), Icon delete (Red), Hover hiệu ứng nhẹ.

### Modals & Forms
- Overlay phông mờ (`rgba(15, 23, 42, 0.4)`).
- Input fields có border `#E2E8F0`, khi focus đổi sang `border-color: var(--primary)` kèm ring outline nhẹ.