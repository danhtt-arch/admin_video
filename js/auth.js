// Auth: Đăng nhập, Quên mật khẩu, Auth Guards (hệ thống chỉ dành cho ADMIN, không có đăng ký công khai)
import { supabase, isConfigured } from "./config.js";
import { showToast, setButtonLoading, getErrorMessage } from "./utils.js";

/* ------------------------------------------------------------------ */
/* Core API                                                            */
/* ------------------------------------------------------------------ */

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, email, role, is_locked, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await getProfile(data.user.id);
  if (profile?.is_locked) {
    await supabase.auth.signOut();
    throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
  }
  if (profile?.role !== "ADMIN") {
    await supabase.auth.signOut();
    throw new Error("Chỉ tài khoản ADMIN mới được truy cập hệ thống.");
  }
  return data;
}

export async function sendResetEmail(email) {
  const redirectTo = new URL("reset-password.html", window.location.href).href;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    showToast(getErrorMessage(error), "error");
  } finally {
    window.location.href = "login.html";
  }
}

/* ------------------------------------------------------------------ */
/* Guards                                                              */
/* ------------------------------------------------------------------ */

/**
 * Bảo vệ trang: chưa đăng nhập → redirect login.html.
 * Trả về { user, profile, isAdmin }.
 */
export async function checkAuth() {
  if (!isConfigured) {
    showToast("Chưa cấu hình SUPABASE_ANON_KEY trong js/config.js", "error", 8000);
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = data.session;
    if (!session) {
      window.location.replace("login.html");
      return null;
    }
    const user = session.user;
    const profile = await getProfile(user.id);
    if (profile?.is_locked) {
      await supabase.auth.signOut();
      window.location.replace("login.html?locked=1");
      return null;
    }
    // Hệ thống chỉ dành cho ADMIN: không có profile hoặc role khác ADMIN → không được vào.
    if (profile?.role !== "ADMIN") {
      await supabase.auth.signOut();
      window.location.replace("login.html?error=forbidden");
      return null;
    }
    return { user, profile, isAdmin: true };
  } catch (error) {
    // Phải signOut trước khi về login.html, nếu không login.html thấy session còn sống
    // sẽ redirect ngược về index.html → vòng lặp vô hạn khi lỗi (RLS/mạng) kéo dài.
    await supabase.auth.signOut().catch(() => {});
    window.location.replace("login.html?error=session");
    return null;
  }
}

/** Chỉ ADMIN được vào. Nếu không → báo lỗi và quay về Dashboard. */
export function requireAdmin(auth) {
  if (!auth?.isAdmin) {
    showToast("Bạn không có quyền truy cập trang này.", "error");
    setTimeout(() => window.location.replace("index.html"), 900);
    return false;
  }
  return true;
}

async function redirectIfAuthed() {
  const { data } = await supabase.auth.getSession();
  if (data.session) window.location.replace("index.html");
}

/* ------------------------------------------------------------------ */
/* Page initializers (login / forgot / reset)                          */
/* ------------------------------------------------------------------ */

function showAlert(el, message, type = "error") {
  if (!el) return;
  el.textContent = message;
  el.className = `auth-alert ${type}`;
}

export async function initLoginPage() {
  if (!isConfigured) showToast("Chưa cấu hình SUPABASE_ANON_KEY trong js/config.js", "warning", 8000);
  await redirectIfAuthed().catch(() => {});

  const form = document.getElementById("login-form");
  const alertEl = document.getElementById("auth-alert");
  const params = new URLSearchParams(location.search);
  if (params.get("locked")) showAlert(alertEl, "Tài khoản của bạn đã bị khóa.");
  if (params.get("error") === "forbidden") showAlert(alertEl, "Chỉ tài khoản ADMIN mới được truy cập hệ thống.");
  if (params.get("error") === "session") {
    showAlert(alertEl, "Không tải được thông tin phiên đăng nhập. Vui lòng đăng nhập lại.");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const email = form.email.value.trim();
    const password = form.password.value;
    alertEl.className = "auth-alert hidden";
    setButtonLoading(btn, true, "Đang đăng nhập...");
    try {
      await login(email, password);
      window.location.href = "index.html";
    } catch (error) {
      const msg = /invalid login/i.test(error.message)
        ? "Email hoặc mật khẩu không đúng."
        : /email not confirmed/i.test(error.message)
          ? "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư."
          : getErrorMessage(error);
      showAlert(alertEl, msg);
      showToast(msg, "error");
      setButtonLoading(btn, false);
    }
  });
}

export function initForgotPage() {
  const form = document.getElementById("forgot-form");
  const alertEl = document.getElementById("auth-alert");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    alertEl.className = "auth-alert hidden";
    setButtonLoading(btn, true, "Đang gửi...");
    try {
      await sendResetEmail(form.email.value.trim());
      showAlert(alertEl, "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.", "success");
      form.reset();
    } catch (error) {
      showAlert(alertEl, getErrorMessage(error));
      showToast(getErrorMessage(error), "error");
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

export async function initResetPage() {
  const form = document.getElementById("reset-form");
  const alertEl = document.getElementById("auth-alert");

  // Supabase tự đọc token recovery từ URL và tạo session tạm.
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    showAlert(alertEl, "Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại.");
    form.classList.add("hidden");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    alertEl.className = "auth-alert hidden";
    if (form.password.value.length < 6) return showAlert(alertEl, "Mật khẩu phải có ít nhất 6 ký tự.");
    if (form.password.value !== form.confirm.value) return showAlert(alertEl, "Mật khẩu xác nhận không khớp.");
    setButtonLoading(btn, true, "Đang cập nhật...");
    try {
      await updatePassword(form.password.value);
      showToast("Đổi mật khẩu thành công!", "success");
      setTimeout(() => (window.location.href = "index.html"), 800);
    } catch (error) {
      showAlert(alertEl, getErrorMessage(error));
      setButtonLoading(btn, false);
    }
  });
}
