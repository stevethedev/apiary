CREATE TABLE open_tabs (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES requests(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  draft_method TEXT NOT NULL,
  draft_url TEXT NOT NULL,
  draft_params_json TEXT NOT NULL,
  draft_headers_json TEXT NOT NULL,
  draft_auth_json TEXT NOT NULL,
  draft_body_json TEXT NOT NULL,
  is_dirty INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
