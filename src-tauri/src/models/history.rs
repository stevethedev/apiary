use serde::{Deserialize, Serialize};

use super::request::{AuthPayload, KeyValueRow, StoredBody};

/// Full standalone snapshot of a request as sent, plus response metadata
/// (no response body — see the history design decision). Never a pointer
/// to a saved Request row.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub id: String,
    pub method: String,
    pub url: String,
    pub params: Vec<KeyValueRow>,
    pub headers: Vec<KeyValueRow>,
    pub auth: AuthPayload,
    pub body: StoredBody,
    pub status_code: Option<i64>,
    pub duration_ms: Option<i64>,
    pub response_size_bytes: Option<i64>,
    pub response_headers: Option<Vec<(String, String)>>,
    pub error_kind: Option<String>,
    pub executed_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntryInput {
    pub method: String,
    pub url: String,
    pub params: Vec<KeyValueRow>,
    pub headers: Vec<KeyValueRow>,
    pub auth: AuthPayload,
    pub body: StoredBody,
    pub status_code: Option<i64>,
    pub duration_ms: Option<i64>,
    pub response_size_bytes: Option<i64>,
    pub response_headers: Option<Vec<(String, String)>>,
    pub error_kind: Option<String>,
}
