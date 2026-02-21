# Supabase setup for per-user data

Run the migration so that **bank balance** and **per-user transactions** work.

1. Open your [Supabase project](https://supabase.com/dashboard) → **SQL Editor**.
2. Paste and run the contents of `migrations/001_user_settings_and_transactions_user_id.sql`.

This will:

- Create **`user_settings`** with `user_id`, `current_balance`, and `updated_at`. Each user’s balance is stored here.
- Add **`user_id`** to **`transactions`** (nullable). Rows with `user_id` belong to that user; `user_id IS NULL` keeps existing seed/demo data by `user_type`.

After running the migration, the app will:

- Use **balance** from `user_settings` when the user is logged in (or seed balance if they haven’t set one yet).
- Use **transactions** for that user when logged in (by `user_id`). New users start with no transactions until you add or import data.
