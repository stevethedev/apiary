use rusqlite::params;
use tauri::State;

use crate::database::{new_id, now, DbError, DbState};
use crate::models::history::{HistoryEntry, HistoryEntryInput};

fn row_to_history_entry(row: &rusqlite::Row) -> rusqlite::Result<HistoryEntry> {
    let params_json: String = row.get("params_json")?;
    let headers_json: String = row.get("headers_json")?;
    let auth_json: String = row.get("auth_json")?;
    let body_json: String = row.get("body_json")?;
    let response_headers_json: Option<String> = row.get("response_headers_json")?;

    Ok(HistoryEntry {
        id: row.get("id")?,
        method: row.get("method")?,
        url: row.get("url")?,
        params: serde_json::from_str(&params_json).unwrap_or_default(),
        headers: serde_json::from_str(&headers_json).unwrap_or_default(),
        auth: serde_json::from_str(&auth_json)
            .unwrap_or(crate::models::request::AuthPayload::None),
        body: serde_json::from_str(&body_json)
            .unwrap_or(crate::models::request::StoredBody::None),
        status_code: row.get("status_code")?,
        duration_ms: row.get("duration_ms")?,
        response_size_bytes: row.get("response_size_bytes")?,
        response_headers: response_headers_json
            .and_then(|json| serde_json::from_str(&json).ok()),
        error_kind: row.get("error_kind")?,
        executed_at: row.get("executed_at")?,
    })
}

#[tauri::command]
pub fn append_history(
    state: State<'_, DbState>,
    entry: HistoryEntryInput,
) -> Result<HistoryEntry, DbError> {
    let conn = state.conn.lock().unwrap();
    let id = new_id();
    let timestamp = now();

    let params_json = serde_json::to_string(&entry.params)?;
    let headers_json = serde_json::to_string(&entry.headers)?;
    let auth_json = serde_json::to_string(&entry.auth)?;
    let body_json = serde_json::to_string(&entry.body)?;
    let response_headers_json = entry
        .response_headers
        .as_ref()
        .map(serde_json::to_string)
        .transpose()?;

    conn.execute(
        "INSERT INTO history
         (id, method, url, params_json, headers_json, auth_json, body_json,
          status_code, duration_ms, response_size_bytes, response_headers_json, error_kind, executed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            id,
            entry.method,
            entry.url,
            params_json,
            headers_json,
            auth_json,
            body_json,
            entry.status_code,
            entry.duration_ms,
            entry.response_size_bytes,
            response_headers_json,
            entry.error_kind,
            timestamp,
        ],
    )?;

    Ok(HistoryEntry {
        id,
        method: entry.method,
        url: entry.url,
        params: entry.params,
        headers: entry.headers,
        auth: entry.auth,
        body: entry.body,
        status_code: entry.status_code,
        duration_ms: entry.duration_ms,
        response_size_bytes: entry.response_size_bytes,
        response_headers: entry.response_headers,
        error_kind: entry.error_kind,
        executed_at: timestamp,
    })
}

#[tauri::command]
pub fn list_history(
    state: State<'_, DbState>,
    limit: i64,
    offset: i64,
) -> Result<Vec<HistoryEntry>, DbError> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT * FROM history ORDER BY executed_at DESC LIMIT ?1 OFFSET ?2",
    )?;
    let rows = stmt
        .query_map(params![limit, offset], row_to_history_entry)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(rows)
}

#[tauri::command]
pub fn clear_history(state: State<'_, DbState>) -> Result<(), DbError> {
    let conn = state.conn.lock().unwrap();
    conn.execute("DELETE FROM history", [])?;
    Ok(())
}
