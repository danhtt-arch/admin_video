// Quản lý User & phân quyền (chỉ ADMIN)
import { supabase } from "./config.js";
import { checkAuth, requireAdmin } from "./auth.js";
import { renderLayout } from "./layout.js";
import {
  formatDate, showToast, getErrorMessage, escapeHtml, debounce,
  setButtonLoading, openModal, closeModal, bindModalClose,
} from "./utils.js";

const state = { users: [], search: "", deleting: null };
let auth;
const $ = (id) => document.getElementById(id);

async function loadUsers() {
  $("user-body").innerHTML = `<tr><td colspan="7"><div class="table-state"><span class="spinner"></span><div>Đang tải...</div></div></td></tr>`;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, email, role, is_locked, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    state.users = data || [];
    renderRows();
  } catch (error) {
    $("user-body").innerHTML = `<tr><td colspan="7"><div class="table-state"><i class="fa-solid fa-triangle-exclamation"></i>Không tải được dữ liệu.</div></td></tr>`;
    showToast(getErrorMessage(error), "error");
  }
}

function renderRows() {
  const q = state.search.toLowerCase();
  const users = state.users.filter(
    (u) => !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
  if (!users.length) {
    $("user-body").innerHTML = `<tr><td colspan="7"><div class="table-state"><i class="fa-regular fa-folder-open"></i>Không có người dùng nào.</div></td></tr>`;
    return;
  }
  $("user-body").innerHTML = users
    .map((u) => {
      const isSelf = u.id === auth.user.id;
      return `<tr>
        <td><span class="cell-sub" title="${u.id}" style="max-width:90px">${u.id.slice(0, 8)}…</span></td>
        <td><span class="cell-title">${escapeHtml(u.username)}</span>${isSelf ? ' <span class="badge badge-success">Bạn</span>' : ""}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>
          <select class="form-control" style="width:auto;padding:6px 10px" data-action="role" data-id="${u.id}" ${isSelf ? "disabled" : ""}>
            <option value="USER" ${u.role === "USER" ? "selected" : ""}>USER</option>
            <option value="ADMIN" ${u.role === "ADMIN" ? "selected" : ""}>ADMIN</option>
          </select>
        </td>
        <td>${u.is_locked ? '<span class="badge badge-danger">Đã khóa</span>' : '<span class="badge badge-success">Hoạt động</span>'}</td>
        <td>${formatDate(u.created_at)}</td>
        <td class="col-actions">
          ${isSelf ? '<span class="cell-sub">—</span>' : `
          <button class="btn-icon edit" data-action="lock" data-id="${u.id}" title="${u.is_locked ? "Mở khóa" : "Khóa tài khoản"}">
            <i class="fa-solid ${u.is_locked ? "fa-lock-open" : "fa-lock"}"></i></button>
          <button class="btn-icon delete" data-action="delete" data-id="${u.id}" title="Xóa user"><i class="fa-solid fa-trash"></i></button>`}
        </td>
      </tr>`;
    })
    .join("");
}

async function changeRole(select) {
  const user = state.users.find((u) => u.id === select.dataset.id);
  const newRole = select.value;
  select.disabled = true;
  try {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", user.id);
    if (error) throw error;
    user.role = newRole;
    showToast(`Đã đổi quyền của ${user.username} thành ${newRole}.`, "success");
  } catch (error) {
    select.value = user.role;
    showToast(getErrorMessage(error), "error");
  } finally {
    select.disabled = false;
  }
}

async function toggleLock(id) {
  const user = state.users.find((u) => u.id === id);
  const locked = !user.is_locked;
  try {
    const { error } = await supabase.from("profiles").update({ is_locked: locked }).eq("id", id);
    if (error) throw error;
    user.is_locked = locked;
    renderRows();
    showToast(locked ? `Đã khóa ${user.username}.` : `Đã mở khóa ${user.username}.`, "success");
  } catch (error) {
    showToast(getErrorMessage(error), "error");
  }
}

async function handleDelete() {
  const user = state.deleting;
  if (!user) return;
  const btn = $("btn-confirm-delete");
  setButtonLoading(btn, true, "Đang xóa...");
  try {
    const { error } = await supabase.rpc("admin_delete_user", { target_id: user.id });
    if (error) throw error;
    showToast(`Đã xóa người dùng ${user.username}.`, "success");
    closeModal("confirm-modal");
    await loadUsers();
  } catch (error) {
    showToast(getErrorMessage(error), "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

async function init() {
  auth = await checkAuth();
  if (!auth) return;
  if (!requireAdmin(auth)) return;
  renderLayout({ active: "users", title: "Users", auth });

  bindModalClose("confirm-modal");
  $("btn-confirm-delete").addEventListener("click", handleDelete);
  $("search-input").addEventListener(
    "input",
    debounce((e) => {
      state.search = e.target.value.trim();
      renderRows();
    }, 200)
  );

  $("user-body").addEventListener("change", (e) => {
    const el = e.target.closest('[data-action="role"]');
    if (el) changeRole(el);
  });
  $("user-body").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "lock") toggleLock(btn.dataset.id);
    if (btn.dataset.action === "delete") {
      state.deleting = state.users.find((u) => u.id === btn.dataset.id);
      $("confirm-text").textContent = `Tài khoản "${state.deleting.username}" (${state.deleting.email}) sẽ bị xóa vĩnh viễn.`;
      openModal("confirm-modal");
    }
  });

  await loadUsers();
}

init();
