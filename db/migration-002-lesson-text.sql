-- Migration: cho phép bài học có nội dung dạng văn bản (đọc trực tiếp),
-- không bắt buộc phải có video nữa.
-- Chạy 1 lần trong Supabase SQL Editor (an toàn để chạy lại nhiều lần).

alter table lesson_videos alter column youtube_id drop not null;
alter table lesson_videos add column if not exists content_text text;
