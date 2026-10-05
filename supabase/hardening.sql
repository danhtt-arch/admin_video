-- ============================================================================
-- ADMIN-ONLY HARDENING — chạy SAU setup.sql (an toàn khi chạy lại nhiều lần)
-- Hệ thống chỉ dành cho ADMIN: mọi quyền đọc/ghi dữ liệu đều yêu cầu is_admin()
-- (is_admin() đã loại trừ tài khoản bị khóa). Chưa được chạy trên database.
-- ============================================================================

-- Bỏ các policy mở rộng cho USER, thay bằng policy chỉ ADMIN
DROP POLICY IF EXISTS "categories_select"       ON public.video_categories;
DROP POLICY IF EXISTS "categories_admin_write"  ON public.video_categories;
CREATE POLICY "categories_admin_all" ON public.video_categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "videos_select" ON public.videos;
DROP POLICY IF EXISTS "videos_insert" ON public.videos;
DROP POLICY IF EXISTS "videos_update" ON public.videos;
DROP POLICY IF EXISTS "videos_delete" ON public.videos;
CREATE POLICY "videos_admin_all" ON public.videos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "video_views_select"      ON public.video_views;
DROP POLICY IF EXISTS "video_views_admin_write" ON public.video_views;
CREATE POLICY "video_views_admin_all" ON public.video_views FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- profiles: giữ "profiles_select" (user tự đọc profile của mình để đăng nhập bị từ chối đúng cách,
-- ADMIN đọc tất cả) và "profiles_update_admin" từ setup.sql — không cần đổi.

-- Storage: chỉ ADMIN upload/xóa
DROP POLICY IF EXISTS "media_insert" ON storage.objects;
DROP POLICY IF EXISTS "media_delete" ON storage.objects;
CREATE POLICY "media_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('thumbnails', 'video_files') AND public.is_admin());
CREATE POLICY "media_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('thumbnails', 'video_files') AND public.is_admin());

-- Bucket public không giới hạn loại file → có thể host file HTML/JS tùy ý dưới domain Supabase.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    file_size_limit = 5 * 1024 * 1024
WHERE id = 'thumbnails';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime'],
    file_size_limit = 50 * 1024 * 1024
WHERE id = 'video_files';

-- Đăng ký công khai vẫn có thể gọi được qua API nếu chưa tắt trên dashboard:
-- Authentication → Sign In / Providers → tắt "Allow new users to sign up".
-- (Kể cả khi có người đăng ký, họ chỉ có role USER nên bị chặn ở cả app lẫn RLS.)
