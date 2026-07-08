-- Alter profiles table to add dob, hide_mobile, and hide_dob columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hide_mobile BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hide_dob BOOLEAN DEFAULT false;
