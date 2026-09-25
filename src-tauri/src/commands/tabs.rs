use rusqlite::params;
use tauri::State;

use crate::database::{now, DbError, DbState};
use crate::models::tab::OpenTab;

fn row_to_tab(row: &rusqlite::Row) -> rusqlite::Result<OpenTab> {
    let params_json: String = row.get("draft_params_json")?;
    let headers_json: String = row.get("draft_headers_json")?;
    let auth_json: String = row.get("draft_auth_json")?;
    let body_json: String = row.get("draft_body_json")?;

    Ok(OpenTab {
        id: row.get("id")?,
        request_id: row.get("request_id")?,
        name: row.get("name")?,
        is_active: row.get("is_active")?,
        sort_order: row.get("sort_order")?,
        draft_method: row.get("draft_method")?,
        draft_url: row.get("draft_url")?,
        draft_params: serde_json::from_str(&params_json).unwrap_or_default(),
        draft_headers: serde_json::from_str(&headers_json).unwrap_or_default(),
        draft_auth: serde_json::from_str(&auth_json)
            .unwrap_or(crate::models::request::AuthPayload::None),
        draft_body: serde_json::from_str(&body_json)
            .unwrap_or(crate::models::request::StoredBody::None),
        is_dirty: row.get("is_dirty")?,
    })
}

#[tauri::command]
pub fn load_open_tabs(state: State<'_, DbState>) -> Result<Vec<OpenTab>, DbError> {
    let conn = state.connection();
    let mut stmt = conn.prepare("SELECT * FROM open_tabs ORDER BY sort_order")?;
    let rows = stmt
        .query_map([], row_to_tab)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(rows)
}

/// Replaces the entire `open_tabs` table contents in one transaction —
/// simplest correct approach given the tab count is always small. Called
/// (debounced on the frontend) on every tab-set/draft mutation.
#[tauri::command]
pub fn save_open_tabs(state: State<'_, DbState>, tabs: Vec<OpenTab>) -> Result<(), DbError> {
    let mut conn = state.connection();
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM open_tabs", [])?;
    let timestamp = now();
    for (index, tab) in tabs.iter().enumerate() {
        let params_json = serde_json::to_string(&tab.draft_params)?;
        let headers_json = serde_json::to_string(&tab.draft_headers)?;
        let auth_json = serde_json::to_string(&tab.draft_auth)?;
        let body_json = serde_json::to_string(&tab.draft_body)?;
        tx.execute(
            "INSERT INTO open_tabs
             (id, request_id, name, is_active, sort_order, draft_method, draft_url,
              draft_params_json, draft_headers_json, draft_auth_json, draft_body_json,
              is_dirty, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                tab.id,
                tab.request_id,
                tab.name,
                tab.is_active,
                index as i64,
                tab.draft_method,
                tab.draft_url,
                params_json,
                headers_json,
                auth_json,
                body_json,
                tab.is_dirty,
                timestamp,
            ],
        )?;
    }
    tx.commit()?;
    Ok(())
}
