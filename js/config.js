// Supabase client initialization.
// Project: DHKHTN
// LƯU Ý: Chỉ dùng ANON (public) key ở đây. TUYỆT ĐỐI không đặt DB password hay service_role key vào frontend.
// Lấy anon key tại: Supabase Dashboard → Project Settings → API → "anon public".

export const SUPABASE_URL = "https://gqomgcwzbxxxagdqbpdu.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxb21nY3d6Ynh4eGFnZHFicGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwODgzOTIsImV4cCI6MjEwNjY2NDM5Mn0.GA0zOP7fj61ajUHCXmIxLTCeer8X830M9Znlu0UyTOk";

export const BUCKET_THUMBNAILS = "thumbnails";
export const BUCKET_VIDEOS = "video_files";

if (!window.supabase) {
  throw new Error("Supabase SDK chưa được tải. Kiểm tra thẻ <script> CDN trong file HTML.");
}

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isConfigured = !SUPABASE_ANON_KEY.startsWith("PASTE_");
