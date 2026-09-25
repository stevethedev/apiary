pub mod connection;
pub mod migrations;

use std::sync::Mutex;

use rusqlite::Connection;
use serde::Serialize;

/// A typed, serializable error for DB-backed commands — mirrors the HTTP
/// layer's philosophy of never surfacing a raw Rust error/stack trace.
#[derive(Debug, Serialize)]
pub struct DbError {
    pub message: String,
}

impl From<rusqlite::Error> for DbError {
    fn from(err: rusqlite::Error) -> Self {
        Self {
            message: err.to_string(),
        }
    }
}

impl From<serde_json::Error> for DbError {
    fn from(err: serde_json::Error) -> Self {
        Self {
            message: format!("Malformed stored data: {err}"),
        }
    }
}

/// Tauri-managed state wrapping the single SQLite connection. Commands are
/// synchronous and simply lock this for the duration of a query.
pub struct DbState {
    pub conn: Mutex<Connection>,
}

impl DbState {
    pub fn new(conn: Connection) -> Self {
        Self {
            conn: Mutex::new(conn),
        }
    }
}

pub fn new_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

pub fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}
