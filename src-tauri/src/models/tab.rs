use serde::{Deserialize, Serialize};

use super::request::{AuthPayload, KeyValueRow, StoredBody};

/// A tab's draft state, persisted separately from `requests` so unsaved
/// edits survive a restart without mutating the saved row until Save.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenTab {
    pub id: String,
    pub request_id: Option<String>,
    pub name: String,
    pub is_active: bool,
    pub sort_order: i64,
    pub draft_method: String,
    pub draft_url: String,
    pub draft_params: Vec<KeyValueRow>,
    pub draft_headers: Vec<KeyValueRow>,
    pub draft_auth: AuthPayload,
    pub draft_body: StoredBody,
    pub is_dirty: bool,
}
