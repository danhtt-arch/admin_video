// Base layout: render Sidebar + Header dùng chung cho các trang bảo mật
import { logout } from "./auth.js";
import { escapeHtml, removePageLoader } from "./utils.js";

const NAV_ITEMS = [
  { key: "dashboard", href: "index.html", icon: "fa-chart-line", label: "Dashboard" },
  { key: "videos", href: "videos.html", icon: "fa-film", label: "Videos" },
  { key: "categories", href: "categories.html", icon: "fa-tags", label: "Categories" },
  { key: "users", href: "users.html", icon: "fa-users", label: "Users", adminOnly: true },
];

/**
 * @param {{active: string, title: string, auth: {profile: object, isAdmin: boolean}}} opts
 */
export function renderLayout({ active, title, auth }) {
  const { profile, isAdmin } = auth;
  const initial = (profile.username || profile.email || "?").charAt(0);

  const nav = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin)
    .map(
      (i) => `<a class="nav-link ${i.key === active ? "active" : ""}" href="${i.href}">
        <i class="fa-solid ${i.icon}"></i><span>${i.label}</span></a>`
    )
    .join("");

  document.getElementById("sidebar").innerHTML = `
    <div class="sidebar-logo"><span class="logo-mark"><i class="fa-solid fa-play"></i></span><span>VideoAdmin</span></div>
    <nav class="sidebar-nav">
      <div class="sidebar-section">Menu</div>
      ${nav}
    </nav>
    <div class="sidebar-footer">
      <div class="profile-badge">
        <div class="avatar">${escapeHtml(initial)}</div>
        <div class="profile-info">
          <div class="profile-name">${escapeHtml(profile.username)}</div>
          <div class="profile-email">${escapeHtml(profile.email)}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span class="badge ${isAdmin ? "badge-admin" : "badge-user"}">${escapeHtml(profile.role)}</span>
        <button class="btn btn-outline" id="btn-logout" style="padding:6px 12px">
          <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất
        </button>
      </div>
    </div>`;

  document.getElementById("header").innerHTML = `
    <button class="btn-icon menu-toggle" id="menu-toggle" aria-label="Mở menu"><i class="fa-solid fa-bars"></i></button>
    <h1 class="header-title">${escapeHtml(title)}</h1>
    <div class="header-search">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input type="search" id="global-search" class="form-control" placeholder="Tìm kiếm video..." />
    </div>
    <div class="header-actions">
      <button class="btn-icon" id="btn-bell" aria-label="Thông báo"><i class="fa-regular fa-bell"></i></button>
      <div class="avatar" title="${escapeHtml(profile.username)}">${escapeHtml(initial)}</div>
      <button class="btn-icon delete" id="btn-logout-header" title="Đăng xuất" aria-label="Đăng xuất">
        <i class="fa-solid fa-right-from-bracket"></i>
      </button>
    </div>`;

  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const toggle = (open) => {
    sidebar.classList.toggle("open", open);
    backdrop?.classList.toggle("open", open);
  };
  document.getElementById("menu-toggle").addEventListener("click", () => toggle(!sidebar.classList.contains("open")));
  backdrop?.addEventListener("click", () => toggle(false));

  document.getElementById("btn-logout").addEventListener("click", logout);
  document.getElementById("btn-logout-header").addEventListener("click", logout);
  document.getElementById("btn-bell").addEventListener("click", async () => {
    const { showToast } = await import("./utils.js");
    showToast("Không có thông báo mới.", "info");
  });

  // Search ở header: ngoài trang Videos thì chuyển sang videos.html?q=...
  if (active !== "videos") {
    document.getElementById("global-search").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim()) {
        window.location.href = `videos.html?q=${encodeURIComponent(e.target.value.trim())}`;
      }
    });
  }

  removePageLoader();
}
