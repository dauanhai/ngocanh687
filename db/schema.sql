-- Tự Do Thịnh Vượng / Đậu Ánh AI — schema học viện
-- Chạy 1 lần trong Supabase Dashboard > SQL Editor > New query > Run.
-- An toàn để chạy lại nhiều lần (dùng IF NOT EXISTS / DROP POLICY IF EXISTS).

create extension if not exists pgcrypto;

-- ==================== profiles ====================
-- Hồ sơ mở rộng cho mỗi tài khoản Supabase Auth (auth.users).
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on profiles;
create policy "profiles_upsert_own" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- Tự tạo profile trống khi có tài khoản mới đăng ký.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ==================== courses ====================
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  price integer not null default 0, -- VNĐ, 0 = miễn phí
  is_bundle boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table courses enable row level security;

drop policy if exists "courses_select_all" on courses;
create policy "courses_select_all" on courses
  for select using (true);

-- ==================== lessons ====================
-- Metadata công khai (không chứa video). Ai cũng xem được tiêu đề/số bài.
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  is_preview boolean not null default false, -- true = xem được kể cả chưa mua
  created_at timestamptz not null default now()
);

alter table lessons enable row level security;

drop policy if exists "lessons_select_all" on lessons;
create policy "lessons_select_all" on lessons
  for select using (true);

-- ==================== enrollments ====================
-- Ai đã được mở khoá khoá học nào. Chỉ server (service-role) mới insert được.
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  order_id uuid,
  unlocked_at timestamptz not null default now(),
  unique (student_id, course_id)
);

alter table enrollments enable row level security;

drop policy if exists "enrollments_select_own" on enrollments;
create policy "enrollments_select_own" on enrollments
  for select using (auth.uid() = student_id);

-- Cố tình KHÔNG tạo policy insert/update cho role "authenticated":
-- chỉ service-role key (bỏ qua RLS) từ route admin mới ghi được bảng này.

-- ==================== lesson_videos ====================
-- Tách riêng khỏi `lessons` để RLS chặn được nội dung theo hàng.
-- Chỉ lộ ra nếu: bài học is_preview = true, HOẶC học viên đã có enrollment
-- cho đúng khoá học chứa bài học đó.
-- Một bài học có thể chỉ có video, chỉ có văn bản, hoặc cả hai.
create table if not exists lesson_videos (
  lesson_id uuid primary key references lessons(id) on delete cascade,
  youtube_id text,
  content_text text
);

alter table lesson_videos enable row level security;

drop policy if exists "lesson_videos_select_unlocked" on lesson_videos;
create policy "lesson_videos_select_unlocked" on lesson_videos
  for select using (
    exists (
      select 1 from lessons l
      where l.id = lesson_videos.lesson_id
        and (
          l.is_preview = true
          or exists (
            select 1 from enrollments e
            where e.student_id = auth.uid()
              and e.course_id = l.course_id
          )
        )
    )
  );

-- ==================== orders ====================
-- Đơn "chờ chuyển khoản". Học viên tự tạo, chỉ server mới đổi được status.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  amount integer not null,
  transfer_code text not null default upper(substr(gen_random_uuid()::text, 1, 8)),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table orders enable row level security;

drop policy if exists "orders_select_own" on orders;
create policy "orders_select_own" on orders
  for select using (auth.uid() = student_id);

drop policy if exists "orders_insert_own_pending" on orders;
create policy "orders_insert_own_pending" on orders
  for insert with check (auth.uid() = student_id and status = 'pending');

-- Không có policy update cho "authenticated" -> chỉ service-role (route admin) đổi status.

-- ==================== lesson_progress ====================
create table if not exists lesson_progress (
  student_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  completed boolean not null default true,
  completed_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

alter table lesson_progress enable row level security;

drop policy if exists "lesson_progress_all_own" on lesson_progress;
create policy "lesson_progress_all_own" on lesson_progress
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- ==================== Dữ liệu mẫu (tuỳ chọn) ====================
-- Bỏ comment đoạn dưới nếu muốn có sẵn 1 khoá học + 1 bài học preview để test nhanh.
-- insert into courses (slug, title, description, price, sort_order)
--   values ('mat-ma-tu-duy', 'Mật Mã Tư Duy', 'Định hình tư duy đúng về Affiliate Marketing.', 99000, 1)
--   returning id;
-- -- copy id vừa tạo vào dòng dưới:
-- insert into lessons (course_id, title, sort_order, is_preview)
--   values ('<paste-course-id-here>', 'Bài 1: Vì sao tư duy quan trọng hơn kỹ năng', 1, true);
