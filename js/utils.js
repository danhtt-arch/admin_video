// Helper functions

export function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0);
}

export function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const opts = withTime
    ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Intl.DateTimeFormat("vi-VN", opts).format(date);
}

/** Định dạng dung lượng. `unit` là đơn vị đầu vào: "B" hoặc "MB". */
export function formatBytes(value, unit = "B") {
  let bytes = Number(value) || 0;
  if (unit === "MB") bytes *= 1024 * 1024;
  if (bytes <= 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const n = bytes / Math.pow(1024, i);
  return `${n.toFixed(i === 0 ? 0 : 2).replace(/\.?0+$/, "")} ${units[i]}`;
}

export function bytesToMB(bytes) {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const TOAST_ICONS = {
  success: "fa-circle-check",
  error: "fa-circle-xmark",
  warning: "fa-triangle-exclamation",
  info: "fa-circle-info",
};

export function showToast(message, type = "info", duration = 3500) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("leaving");
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

/** Bật/tắt trạng thái loading cho button. */
export function setButtonLoading(button, loading, loadingText = "Đang xử lý...") {
  if (!button) return;
  if (loading) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> ${escapeHtml(loadingText)}`;
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml !== undefined) button.innerHTML = button.dataset.originalHtml;
  }
}

export function getErrorMessage(error) {
  return error?.message || (typeof error === "string" ? error : "Đã xảy ra lỗi không xác định.");
}

export function removePageLoader() {
  document.getElementById("page-loader")?.remove();
}

/** Modal helpers */
export function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}
export function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}
export function bindModalClose(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest("[data-close-modal]")) closeModal(id);
  });
}

export const PLACEHOLDER_THUMB =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect width="100%" height="100%" fill="#f1f5f9"/><path d="M170 85v55l50-27.5z" fill="#cbd5e1"/></svg>'
  );
