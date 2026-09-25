use serde::{Deserialize, Serialize};

/// Auth config shape shared between the resolved payload sent to
/// `send_request` and the stored (possibly still-templated, e.g.
/// `{{token}}`) auth config on a saved request/history entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum AuthPayload {
    None,
    Bearer {
        token: String,
    },
    Basic {
        username: String,
        password: String,
    },
    ApiKey {
        key: String,
        value: String,
        placement: String, // "header" | "query"
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyValueRow {
    pub id: String,
    pub key: String,
    pub value: String,
    pub enabled: bool,
}

/// Body config as stored on a saved request/history entry/open tab draft.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum StoredBody {
    None,
    Json { content: String },
    Raw { content: String },
    Form { rows: Vec<KeyValueRow> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedRequest {
    pub id: String,
    pub collection_id: String,
    pub name: String,
    pub method: String,
    pub url: String,
    pub params: Vec<KeyValueRow>,
    pub headers: Vec<KeyValueRow>,
    pub auth: AuthPayload,
    pub body: StoredBody,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

/// Fields the frontend supplies when creating or updating a request; the
/// server owns `id`/`sort_order`/timestamps.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedRequestInput {
    pub collection_id: String,
    pub name: String,
    pub method: String,
    pub url: String,
    pub params: Vec<KeyValueRow>,
    pub headers: Vec<KeyValueRow>,
    pub auth: AuthPayload,
    pub body: StoredBody,
}

/// A fully resolved request ready to send: the frontend has already
/// substituted every `{{variable}}` reference and folded query params into
/// `url`, so Rust never needs to know about environments or variables.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpRequestPayload {
    pub method: String,
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: Option<String>,
    pub auth: AuthPayload,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpResponseResult {
    pub status_code: u16,
    pub status_text: String,
    pub headers: Vec<(String, String)>,
    pub body: String,
    pub body_size_bytes: usize,
    pub duration_ms: u64,
}
