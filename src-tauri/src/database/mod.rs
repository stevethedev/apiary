pub mod connection;
pub mod migrations;

use std::sync::{Mutex, MutexGuard};

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

/// Tauri-managed state wrapping the single `SQLite` connection. Commands are
/// synchronous and simply lock this for the duration of a query.
pub struct DbState {
    conn: Mutex<Connection>,
}

impl DbState {
    pub fn new(conn: Connection) -> Self {
        Self {
            conn: Mutex::new(conn),
        }
    }

    /// Locks the connection, recovering from a poisoned mutex instead of
    /// panicking. Every command handler goes through this rather than
    /// `.conn.lock().unwrap()` directly: with 25+ call sites sharing one
    /// mutex, a panic while any single command held the lock would
    /// otherwise poison it and take down every subsequent DB command for
    /// the rest of the process's life. A `rusqlite::Connection` has no
    /// invariant that a panic mid-query could leave "torn" — the worse
    /// case is an already-observed `SQLite` error — so recovering here is
    /// safe and keeps one bad request from cascading into a full outage.
    pub fn connection(&self) -> MutexGuard<'_, Connection> {
        self.conn.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }
}

#[must_use]
pub fn new_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

#[must_use]
pub fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}
