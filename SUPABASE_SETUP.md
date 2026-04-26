# Supabase Configuration

To make the sync work, you need to:
1. Create a project at https://supabase.com
2. Go to Project Settings -> API
3. Copy the `Project URL` and `anon public` Key
4. Add them to your environment variables on Netlify or your `.env` file:

VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

### Database Tables Schema

Run this in the Supabase SQL Editor:

```sql
-- Create App Data table (JSON bucket for simplicity and flexibility)
CREATE TABLE IF NOT EXISTS app_store (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE app_store ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (since you want it to just work)
-- In production, you would restrict this to authenticated users
CREATE POLICY "Public full access" ON app_store
  FOR ALL
  USING (true)
  WITH CHECK (true);
```
