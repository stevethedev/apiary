use rusqlite::params;
use tauri::State;

use crate::database::{new_id, now, DbError, DbState};
use crate::models::request::{SavedRequest, SavedRequestInput};

fn row_to_request(row: &rusqlite::Row) -> rusqlite::Result<SavedRequest> {
    let params_json: String = row.get("params_json")?;
    let headers_json: String = row.get("headers_json")?;
    let auth_json: String = row.get("auth_json")?;
    let body_json: String = row.get("body_json")?;

    Ok(SavedRequest {
        id: row.get("id")?,
        collection_id: row.get("collection_id")?,
        name: row.get("name")?,
        method: row.get("method")?,
        url: row.get("url")?,
        params: serde_json::from_str(&params_json).unwrap_or_default(),
        headers: serde_json::from_str(&headers_json).unwrap_or_default(),
        auth: serde_json::from_str(&auth_json)
            .unwrap_or(crate::models::request::AuthPayload::None),
        body: serde_json::from_str(&body_json)
            .unwrap_or(crate::models::request::StoredBody::None),
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

/// # Errors
///
/// Returns [`DbError`] if the underlying query fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn list_requests(
    state: State<'_, DbState>,
    collection_id: String,
) -> Result<Vec<SavedRequest>, DbError> {
    let conn = state.connection();
    let mut stmt = conn.prepare(
        "SELECT * FROM requests WHERE collection_id = ?1 ORDER BY sort_order",
    )?;
    let rows = stmt
        .query_map(params![collection_id], row_to_request)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(rows)
}

/// # Errors
///
/// Returns [`DbError`] if no request with `id` exists, or the query fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn get_request(state: State<'_, DbState>, id: String) -> Result<SavedRequest, DbError> {
    let conn = state.connection();
    let request = conn.query_row(
        "SELECT * FROM requests WHERE id = ?1",
        params![id],
        row_to_request,
    )?;
    Ok(request)
}

/// # Errors
///
/// Returns [`DbError`] if the underlying insert fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn create_request(
    state: State<'_, DbState>,
    input: SavedRequestInput,
) -> Result<SavedRequest, DbError> {
    let conn = state.connection();
    let id = new_id();
    let timestamp = now();
    let next_order: i64 = conn.query_row(
        "SELECT COALESCE(MAX(sort_order) + 1, 0) FROM requests WHERE collection_id = ?1",
        params![input.collection_id],
        |row| row.get(0),
    )?;

    let params_json = serde_json::to_string(&input.params)?;
    let headers_json = serde_json::to_string(&input.headers)?;
    let auth_json = serde_json::to_string(&input.auth)?;
    let body_json = serde_json::to_string(&input.body)?;

    conn.execute(
        "INSERT INTO requests
         (id, collection_id, name, method, url, params_json, headers_json, auth_json, body_json, sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)",
        params![
            id,
            input.collection_id,
            input.name,
            input.method,
            input.url,
            params_json,
            headers_json,
            auth_json,
            body_json,
            next_order,
            timestamp,
        ],
    )?;

    Ok(SavedRequest {
        id,
        collection_id: input.collection_id,
        name: input.name,
        method: input.method,
        url: input.url,
        params: input.params,
        headers: input.headers,
        auth: input.auth,
        body: input.body,
        sort_order: next_order,
        created_at: timestamp.clone(),
        updated_at: timestamp,
    })
}

/// # Errors
///
/// Returns [`DbError`] if the underlying update or reload fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn update_request(
    state: State<'_, DbState>,
    id: String,
    input: SavedRequestInput,
) -> Result<SavedRequest, DbError> {
    let conn = state.connection();
    let timestamp = now();

    let params_json = serde_json::to_string(&input.params)?;
    let headers_json = serde_json::to_string(&input.headers)?;
    let auth_json = serde_json::to_string(&input.auth)?;
    let body_json = serde_json::to_string(&input.body)?;

    conn.execute(
        "UPDATE requests SET
            collection_id = ?1, name = ?2, method = ?3, url = ?4,
            params_json = ?5, headers_json = ?6, auth_json = ?7, body_json = ?8,
            updated_at = ?9
         WHERE id = ?10",
        params![
            input.collection_id,
            input.name,
            input.method,
            input.url,
            params_json,
            headers_json,
            auth_json,
            body_json,
            timestamp,
            id,
        ],
    )?;

    let request = conn.query_row(
        "SELECT * FROM requests WHERE id = ?1",
        params![id],
        row_to_request,
    )?;
    Ok(request)
}

/// # Errors
///
/// Returns [`DbError`] if no request with `id` exists, or the insert fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn duplicate_request(
    state: State<'_, DbState>,
    id: String,
) -> Result<SavedRequest, DbError> {
    let conn = state.connection();
    let original = conn.query_row(
        "SELECT * FROM requests WHERE id = ?1",
        params![id],
        row_to_request,
    )?;

    let new_id_value = new_id();
    let timestamp = now();
    let next_order: i64 = conn.query_row(
        "SELECT COALESCE(MAX(sort_order) + 1, 0) FROM requests WHERE collection_id = ?1",
        params![original.collection_id],
        |row| row.get(0),
    )?;
    let name = format!("{} Copy", original.name);

    let params_json = serde_json::to_string(&original.params)?;
    let headers_json = serde_json::to_string(&original.headers)?;
    let auth_json = serde_json::to_string(&original.auth)?;
    let body_json = serde_json::to_string(&original.body)?;

    conn.execute(
        "INSERT INTO requests
         (id, collection_id, name, method, url, params_json, headers_json, auth_json, body_json, sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)",
        params![
            new_id_value,
            original.collection_id,
            name,
            original.method,
            original.url,
            params_json,
            headers_json,
            auth_json,
            body_json,
            next_order,
            timestamp,
        ],
    )?;

    Ok(SavedRequest {
        id: new_id_value,
        collection_id: original.collection_id,
        name,
        method: original.method,
        url: original.url,
        params: original.params,
        headers: original.headers,
        auth: original.auth,
        body: original.body,
        sort_order: next_order,
        created_at: timestamp.clone(),
        updated_at: timestamp,
    })
}

/// # Errors
///
/// Returns [`DbError`] if the underlying delete fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn delete_request(state: State<'_, DbState>, id: String) -> Result<(), DbError> {
    let conn = state.connection();
    conn.execute("DELETE FROM requests WHERE id = ?1", params![id])?;
    Ok(())
}

/// # Errors
///
/// Returns [`DbError`] if the transaction fails to commit.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn reorder_requests(
    state: State<'_, DbState>,
    collection_id: String,
    ordered_ids: Vec<String>,
) -> Result<(), DbError> {
    let mut conn = state.connection();
    let tx = conn.transaction()?;
    for (index, id) in ordered_ids.iter().enumerate() {
        let sort_order = i64::try_from(index).unwrap_or(i64::MAX);
        tx.execute(
            "UPDATE requests SET sort_order = ?1 WHERE id = ?2 AND collection_id = ?3",
            params![sort_order, id, collection_id],
        )?;
    }
    tx.commit()?;
    Ok(())
}
