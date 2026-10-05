// Quản lý Danh mục Video (ADMIN: CRUD, USER: chỉ xem)
import { supabase } from "./config.js";
import { checkAuth } from "./auth.js";
import { renderLayout } from "./layout.js";
import {
  formatNumber, formatDate, showToast, getErrorMessage, escapeHtml, slugify,
  setButtonLoading, openModal, closeModal, bindModalClose,
} from "./utils.js";

const state = { editing: null, deleting: null, categories: [] };
let auth;
const $ = (id) => document.getElementById(id);

async function loadCategories() {
  const cols = auth.isAdmin ? 6 : 5;
  $("category-body").innerHTML = `<tr><td colspan="${cols}"><div class="table-state"><span class="spinner"></span><div>Đang tải...</div></div></td></tr>`;
  try {
    const { data, error } = await supabase
      .from("video_categories")
      .select("*, videos(count)")
      .order("id");
    if (error) throw error;
    state.categories = data || [];
    renderRows();
  } catch (error) {
    $("category-body").innerHTML = `<tr><td colspan="${cols}"><div class="table-state"><i class="fa-solid fa-triangle-exclamation"></i>Không tải được dữ liệu.</div></td></tr>`;
    showToast(getErrorMessage(error), "error");
  }
}

function renderRows() {
  const cols = auth.isAdmin ? 6 : 5;
  if (!state.categories.length) {
    $("category-body").innerHTML = `<tr><td colspan="${cols}"><div class="table-state"><i class="fa-regular fa-folder-open"></i>Chưa có danh mục nào.</div></td></tr>`;
    return;
  }
  $("category-body").innerHTML = state.categories
    .map((c) => `<tr>
      <td>${c.id}</td>
      <td><span class="cell-title">${escapeHtml(c.name)}</span></td>
      <td><span class="cell-sub">${escapeHtml(c.slug)}</span></td>
      <td>${formatNumber(c.videos?.[0]?.count || 0)}</td>
      <td>${formatDate(c.created_at)}</td>
      ${auth.isAdmin ? `<td class="col-actions">
        <button class="btn-icon edit" data-action="edit" data-id="${c.id}" title="Sửa"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-icon delete" data-action="delete" data-id="${c.id}" title="Xóa"><i class="fa-solid fa-trash"></i></button>
      </td>` : ""}
    </tr>`)
    .join("");
}

function openForm(category = null) {
  state.editing = category;
  $("category-form").reset();
  $("category-modal-title").textContent = category ? "Sửa danh mục" : "Thêm danh mục";
  $("c-name").value = category?.name || "";
  $("c-slug").value = category?.slug || "";
  openModal("category-modal");
  $("c-name").focus();
}

async function handleSave(e) {
  e.preventDefault();
  const name = $("c-name").value.trim();
  const slug = slugify($("c-slug").value.trim() || name);
  if (!name) return showToast("Vui lòng nhập tên danh mục.", "warning");
  if (!slug) return showToast("Slug không hợp lệ.", "warning");

  const btn = $("btn-save");
  setButtonLoading(btn, true, "Đang lưu...");
  try {
    const query = state.editing
      ? supabase.from("video_categories").update({ name, slug }).eq("id", state.editing.id)
      : supabase.from("video_categories").insert({ name, slug });
    const { error } = await query;
    if (error) throw error;
    showToast(state.editing ? "Đã cập nhật danh mục." : "Đã thêm danh mục.", "success");
    closeModal("category-modal");
    await loadCategories();
  } catch (error) {
    const msg = error.code === "23505" ? "Tên hoặc slug danh mục đã tồn tại." : getErrorMessage(error);
    showToast(msg, "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleDelete() {
  const category = state.deleting;
  if (!category) return;
  const btn = $("btn-confirm-delete");
  setButtonLoading(btn, true, "Đang xóa...");
  try {
    const { error } = await supabase.from("video_categories").delete().eq("id", category.id);
    if (error) throw error;
    showToast("Đã xóa danh mục.", "success");
    closeModal("confirm-modal");
    await loadCategories();
  } catch (error) {
    showToast(getErrorMessage(error), "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

async function init() {
  auth = await checkAuth();
  if (!auth) return;
  renderLayout({ active: "categories", title: "Categories", auth });

  if (auth.isAdmin) {
    $("btn-add").classList.remove("hidden");
    document.querySelector(".admin-col").classList.remove("hidden");
  }

  bindModalClose("category-modal");
  bindModalClose("confirm-modal");
  $("btn-add").addEventListener("click", () => openForm());
  $("category-form").addEventListener("submit", handleSave);
  $("btn-confirm-delete").addEventListener("click", handleDelete);

  $("category-body").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const category = state.categories.find((c) => String(c.id) === btn.dataset.id);
    if (!category) return;
    if (btn.dataset.action === "edit") openForm(category);
    else {
      state.deleting = category;
      const n = category.videos?.[0]?.count || 0;
      $("confirm-text").textContent = n
        ? `Danh mục "${category.name}" đang có ${n} video. Các video này sẽ chuyển sang "Chưa phân loại".`
        : `Danh mục "${category.name}" sẽ bị xóa.`;
      openModal("confirm-modal");
    }
  });

  await loadCategories();
}

init();
