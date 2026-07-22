-- Migration: AI Agent trả lời & chốt khách trên Messenger.
-- Chạy 1 lần trong Supabase Dashboard > SQL Editor > New query > Run.
-- An toàn để chạy lại nhiều lần (dùng IF NOT EXISTS).
--
-- Cả 3 bảng dưới đây chỉ được server (service-role key) đọc/ghi qua route
-- /api/messenger/* — bật RLS nhưng CỐ TÌNH không tạo policy nào, để chặn
-- hoàn toàn truy cập trực tiếp từ frontend (anon/authenticated).

-- ==================== messenger_conversations ====================
-- Trạng thái từng hội thoại theo PSID (Page-Scoped ID của khách trên Messenger).
-- paused = true nghĩa là AI tạm ngừng tự trả lời, để chủ trang tự nhắn tay.
create table if not exists messenger_conversations (
  psid text primary key,
  paused boolean not null default false,
  status text not null default 'active' check (status in ('active', 'needs_human', 'closed')),
  updated_at timestamptz not null default now()
);

alter table messenger_conversations enable row level security;

-- ==================== messenger_messages ====================
-- Lịch sử chat để AI có ngữ cảnh khi trả lời (đọc N tin gần nhất theo psid).
create table if not exists messenger_messages (
  id bigint generated always as identity primary key,
  psid text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messenger_messages_psid_idx on messenger_messages (psid, created_at);

alter table messenger_messages enable row level security;

-- ==================== messenger_leads ====================
-- Khách đã chốt/để lại thông tin liên hệ qua AI, chờ chủ trang xử lý tiếp.
create table if not exists messenger_leads (
  id uuid primary key default gen_random_uuid(),
  psid text not null,
  name text,
  phone text,
  product_interest text,
  note text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messenger_leads_psid_idx on messenger_leads (psid);

alter table messenger_leads enable row level security;
