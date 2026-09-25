PRAGMA foreign_keys = ON;

CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  params_json TEXT NOT NULL DEFAULT '[]',
  headers_json TEXT NOT NULL DEFAULT '[]',
  auth_json TEXT NOT NULL DEFAULT '{"type":"none"}',
  body_json TEXT NOT NULL DEFAULT '{"type":"none"}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_requests_collection ON requests(collection_id, sort_order);

CREATE TABLE environments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE environment_variables (
  id TEXT PRIMARY KEY,
  environment_id TEXT NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  is_secret INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(environment_id, key)
);

CREATE TABLE history (
  id TEXT PRIMARY KEY,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  params_json TEXT NOT NULL,
  headers_json TEXT NOT NULL,
  auth_json TEXT NOT NULL,
  body_json TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  response_size_bytes INTEGER,
  response_headers_json TEXT,
  error_kind TEXT,
  executed_at TEXT NOT NULL
);
CREATE INDEX idx_history_executed_at ON history(executed_at DESC);
