// Quản lý Video: CRUD + Upload Thumbnail / Video lên Supabase Storage
import { supabase, BUCKET_THUMBNAILS, BUCKET_VIDEOS } from "./config.js";
import { checkAuth } from "./auth.js";
import { renderLayout } from "./layout.js";
import {
  formatNumber, formatBytes, bytesToMB, showToast, getErrorMessage, escapeHtml, debounce,
  setButtonLoading, openModal, closeModal, bindModalClose, PLACEHOLDER_THUMB,
} from "./utils.js";

const PAGE_SIZE = 10;
const MAX_THUMB_MB = 5;
const MAX_VIDEO_MB = 50; // giới hạn mặc định của Supabase free tier cho 1 file

const state = { page: 1, total: 0, search: "", category: "", editing: null, deleting: null, source: "url" };
let auth;

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const canManage = (video) => auth.isAdmin || video.created_by === auth.user.id;

/** Trích đường dẫn object trong bucket từ public URL; trả null nếu URL ngoài. */
function storagePathFromUrl(url, bucket) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

async function uploadFile(bucket, file) {
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${auth.user.id}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function removeStorageFiles(video) {
  const jobs = [
    [BUCKET_THUMBNAILS, storagePathFromUrl(video.thumbnail_url, BUCKET_THUMBNAILS)],
    [BUCKET_VIDEOS, storagePathFromUrl(video.video_url, BUCKET_VIDEOS)],
  ];
  for (const [bucket, path] of jobs) {
    if (!path) continue;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) console.warn(`Không xóa được file ${bucket}/${path}:`, error.message);
  }
}

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */

async function loadCategories() {
  const { data, error } = await supabase.from("video_categories").select("id, name").order("name");
  if (error) throw error;
  const opts = (data || []).map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  $("category-filter").innerHTML = `<option value="">Tất cả danh mục</option>${opts}`;
  $("f-category").innerHTML = `<option value="">— Chưa phân loại —</option>${opts}`;
}

async function loadVideos() {
  const body = $("video-body");
  body.innerHTML = `<tr><td colspan="7"><div class="table-state"><span class="spinner"></span><div>Đang tải...</div></div></td></tr>`;
  try {
    const from = (state.page - 1) * PAGE_SIZE;
    let query = supabase
      .from("videos")
      .select("*, video_categories(name)", { count: "exact" })
      .order("id", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (state.search) query = query.ilike("title", `%${state.search.replace(/[%_]/g, "\\$&")}%`);
    if (state.category) query = query.eq("category_id", state.category);

    const { data, count, error } = await query;
    if (error) throw error;

    state.total = count || 0;
    // Trang hiện tại vượt quá tổng (vd: vừa xóa bản ghi cuối) → lùi lại
    if (!data.length && state.page > 1) {
      state.page -= 1;
      return loadVideos();
    }
    renderRows(data);
    renderPagination();
  } catch (error) {
    body.innerHTML = `<tr><td colspan="7"><div class="table-state"><i class="fa-solid fa-triangle-exclamation"></i>Không tải được dữ liệu.</div></td></tr>`;
    showToast(getErrorMessage(error), "error");
  }
}

function renderRows(videos) {
  const body = $("video-body");
  if (!videos.length) {
    body.innerHTML = `<tr><td colspan="7"><div class="table-state"><i class="fa-regular fa-folder-open"></i>Không có video nào.</div></td></tr>`;
    return;
  }
  body.innerHTML = videos
    .map((v) => {
      const actions = canManage(v)
        ? `<button class="btn-icon edit" data-action="edit" data-id="${v.id}" title="Sửa"><i class="fa-solid fa-pen"></i></button>
           <button class="btn-icon delete" data-action="delete" data-id="${v.id}" title="Xóa"><i class="fa-solid fa-trash"></i></button>`
        : `<span class="cell-sub">—</span>`;
      return `<tr>
        <td>${v.id}</td>
        <td><img class="table-thumb" src="${escapeHtml(v.thumbnail_url || PLACEHOLDER_THUMB)}" alt="" loading="lazy" onerror="this.src='${PLACEHOLDER_THUMB}'" /></td>
        <td><div class="cell-title">${escapeHtml(v.title)}</div>
            <div class="cell-sub">${escapeHtml(v.description || "")}</div></td>
        <td>${v.video_categories ? `<span class="badge badge-category">${escapeHtml(v.video_categories.name)}</span>` : '<span class="cell-sub">—</span>'}</td>
        <td>${formatBytes(v.storage_size_mb, "MB")}</td>
        <td>${formatNumber(v.views_count)}</td>
        <td class="col-actions">${actions}</td>
      </tr>`;
    })
    .join("");
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(state.total / PAGE_SIZE));
  const from = state.total ? (state.page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(state.page * PAGE_SIZE, state.total);
  $("page-info").textContent = `Hiển thị ${from}–${to} / ${formatNumber(state.total)} video`;

  const pages = [];
  const start = Math.max(1, Math.min(state.page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  $("page-controls").innerHTML =
    `<button class="page-btn" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}><i class="fa-solid fa-chevron-left"></i></button>` +
    pages.map((p) => `<button class="page-btn ${p === state.page ? "active" : ""}" data-page="${p}">${p}</button>`).join("") +
    `<button class="page-btn" data-page="${state.page + 1}" ${state.page === totalPages ? "disabled" : ""}><i class="fa-solid fa-chevron-right"></i></button>`;
}

/* ------------------------------------------------------------------ */
/* Add / Edit                                                          */
/* ------------------------------------------------------------------ */

function setSource(source) {
  state.source = source;
  document.querySelectorAll(".source-tab").forEach((t) => t.classList.toggle("active", t.dataset.source === source));
  $("f-video-url").classList.toggle("hidden", source !== "url");
  $("f-video-file").classList.toggle("hidden", source !== "file");
  $("size-group").classList.toggle("hidden", source === "file");
}

function showThumbPreview(url) {
  $("thumb-preview").innerHTML = url ? `<img src="${escapeHtml(url)}" alt="Preview" />` : "";
}

function openForm(video = null) {
  state.editing = video;
  $("video-form").reset();
  $("video-modal-title").textContent = video ? `Sửa video #${video.id}` : "Thêm video";
  $("f-title").value = video?.title || "";
  $("f-description").value = video?.description || "";
  $("f-category").value = video?.category_id ?? "";
  $("f-video-url").value = video?.video_url || "";
  $("f-size").value = video ? video.storage_size_mb : "";
  $("video-hint").textContent = video ? "Để trống nếu muốn giữ nguyên video hiện tại khi chọn tải file." : "";
  setSource("url");
  showThumbPreview(video?.thumbnail_url);
  openModal("video-modal");
  $("f-title").focus();
}

async function handleSave(e) {
  e.preventDefault();
  const btn = $("btn-save");
  const title = $("f-title").value.trim();
  const thumbFile = $("f-thumb").files[0];
  const videoFile = $("f-video-file").files[0];
  const editing = state.editing;

  if (!title) return showToast("Vui lòng nhập tiêu đề.", "warning");
  if (thumbFile && thumbFile.size > MAX_THUMB_MB * 1024 * 1024) return showToast(`Thumbnail tối đa ${MAX_THUMB_MB}MB.`, "warning");
  if (state.source === "file" && videoFile && videoFile.size > MAX_VIDEO_MB * 1024 * 1024) {
    return showToast(`File video tối đa ${MAX_VIDEO_MB}MB.`, "warning");
  }

  let videoUrl = editing?.video_url || "";
  let sizeMB = Number($("f-size").value) || 0;
  if (state.source === "url") {
    videoUrl = $("f-video-url").value.trim();
    if (!/^https?:\/\//i.test(videoUrl)) return showToast("Vui lòng nhập URL video hợp lệ (http/https).", "warning");
  } else if (!videoFile && !editing) {
    return showToast("Vui lòng chọn file video.", "warning");
  } else if (!videoFile && editing) {
    sizeMB = Number(editing.storage_size_mb) || 0;
  }

  setButtonLoading(btn, true, "Đang lưu...");
  const uploaded = []; // [bucket, url] để rollback khi lỗi
  try {
    let thumbUrl = editing?.thumbnail_url || null;
    if (thumbFile) {
      thumbUrl = await uploadFile(BUCKET_THUMBNAILS, thumbFile);
      uploaded.push([BUCKET_THUMBNAILS, thumbUrl]);
    }
    if (state.source === "file" && videoFile) {
      videoUrl = await uploadFile(BUCKET_VIDEOS, videoFile);
      uploaded.push([BUCKET_VIDEOS, videoUrl]);
      sizeMB = bytesToMB(videoFile.size);
    }

    const payload = {
      title,
      description: $("f-description").value.trim() || null,
      category_id: $("f-category").value || null,
      thumbnail_url: thumbUrl,
      video_url: videoUrl,
      storage_size_mb: sizeMB,
    };

    if (editing) {
      const { error } = await supabase
        .from("videos")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editing.id);
      if (error) throw error;
      // Dọn file cũ đã bị thay thế
      const stale = {
        ...(thumbFile ? { thumbnail_url: editing.thumbnail_url } : {}),
        ...(videoUrl !== editing.video_url ? { video_url: editing.video_url } : {}),
      };
      await removeStorageFiles(stale);
      showToast("Đã cập nhật video.", "success");
    } else {
      const { error } = await supabase.from("videos").insert({ ...payload, created_by: auth.user.id });
      if (error) throw error;
      showToast("Đã thêm video.", "success");
      state.page = 1;
    }
    closeModal("video-modal");
    await loadVideos();
  } catch (error) {
    // Rollback file vừa upload để không để lại file mồ côi
    for (const [bucket, url] of uploaded) {
      const path = storagePathFromUrl(url, bucket);
      if (path) await supabase.storage.from(bucket).remove([path]).catch(() => {});
    }
    showToast(getErrorMessage(error), "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

/* ------------------------------------------------------------------ */
/* Delete                                                              */
/* ------------------------------------------------------------------ */

async function handleDelete() {
  const video = state.deleting;
  if (!video) return;
  const btn = $("btn-confirm-delete");
  setButtonLoading(btn, true, "Đang xóa...");
  try {
    const { error } = await supabase.from("videos").delete().eq("id", video.id);
    if (error) throw error;
    await removeStorageFiles(video);
    showToast("Đã xóa video.", "success");
    closeModal("confirm-modal");
    await loadVideos();
  } catch (error) {
    showToast(getErrorMessage(error), "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */

function bindEvents() {
  bindModalClose("video-modal");
  bindModalClose("confirm-modal");

  $("btn-add").addEventListener("click", () => openForm());
  $("video-form").addEventListener("submit", handleSave);
  $("btn-confirm-delete").addEventListener("click", handleDelete);

  document.querySelectorAll(".source-tab").forEach((t) =>
    t.addEventListener("click", () => setSource(t.dataset.source))
  );
  $("f-thumb").addEventListener("change", (e) => {
    const file = e.target.files[0];
    showThumbPreview(file ? URL.createObjectURL(file) : state.editing?.thumbnail_url);
  });

  const applySearch = debounce((value) => {
    state.search = value.trim();
    state.page = 1;
    loadVideos();
  }, 300);
  const searchInputs = [$("search-input"), $("global-search")];
  searchInputs.forEach((input) =>
    input.addEventListener("input", (e) => {
      searchInputs.forEach((o) => { if (o !== e.target) o.value = e.target.value; });
      applySearch(e.target.value);
    })
  );
  $("category-filter").addEventListener("change", (e) => {
    state.category = e.target.value;
    state.page = 1;
    loadVideos();
  });

  $("page-controls").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    state.page = Number(btn.dataset.page);
    loadVideos();
  });

  $("video-body").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    try {
      const { data, error } = await supabase.from("videos").select("*").eq("id", btn.dataset.id).single();
      if (error) throw error;
      if (btn.dataset.action === "edit") openForm(data);
      else {
        state.deleting = data;
        $("confirm-text").textContent = `"${data.title}" sẽ bị xóa vĩnh viễn cùng các file trên Storage.`;
        openModal("confirm-modal");
      }
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  });
}

async function init() {
  auth = await checkAuth();
  if (!auth) return;
  renderLayout({ active: "videos", title: "Videos", auth });
  bindEvents();

  const q = new URLSearchParams(location.search).get("q");
  if (q) {
    state.search = q;
    $("search-input").value = q;
    $("global-search").value = q;
  }
  try {
    await loadCategories();
  } catch (error) {
    showToast(getErrorMessage(error), "error");
  }
  await loadVideos();
}

init();
