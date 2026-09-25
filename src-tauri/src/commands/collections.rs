use rusqlite::params;
use tauri::State;

use crate::database::{new_id, now, DbError, DbState};
use crate::models::collection::Collection;

fn row_to_collection(row: &rusqlite::Row) -> rusqlite::Result<Collection> {
    Ok(Collection {
        id: row.get("id")?,
        name: row.get("name")?,
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
pub fn list_collections(state: State<'_, DbState>) -> Result<Vec<Collection>, DbError> {
    let conn = state.connection();
    let mut stmt = conn.prepare(
        "SELECT id, name, sort_order, created_at, updated_at FROM collections ORDER BY sort_order",
    )?;
    let rows = stmt
        .query_map([], row_to_collection)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(rows)
}

/// # Errors
///
/// Returns [`DbError`] if the underlying insert fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn create_collection(state: State<'_, DbState>, name: String) -> Result<Collection, DbError> {
    let conn = state.connection();
    let id = new_id();
    let timestamp = now();
    let next_order: i64 = conn.query_row(
        "SELECT COALESCE(MAX(sort_order) + 1, 0) FROM collections",
        [],
        |row| row.get(0),
    )?;
    conn.execute(
        "INSERT INTO collections (id, name, sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4)",
        params![id, name, next_order, timestamp],
    )?;
    Ok(Collection {
        id,
        name,
        sort_order: next_order,
        created_at: timestamp.clone(),
        updated_at: timestamp,
    })
}

/// # Errors
///
/// Returns [`DbError`] if the underlying update fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn rename_collection(
    state: State<'_, DbState>,
    id: String,
    name: String,
) -> Result<(), DbError> {
    let conn = state.connection();
    conn.execute(
        "UPDATE collections SET name = ?1, updated_at = ?2 WHERE id = ?3",
        params![name, now(), id],
    )?;
    Ok(())
}

/// # Errors
///
/// Returns [`DbError`] if the underlying delete fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn delete_collection(state: State<'_, DbState>, id: String) -> Result<(), DbError> {
    let conn = state.connection();
    conn.execute("DELETE FROM collections WHERE id = ?1", params![id])?;
    Ok(())
}

/// # Errors
///
/// Returns [`DbError`] if the transaction fails to commit.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn reorder_collections(
    state: State<'_, DbState>,
    ordered_ids: Vec<String>,
) -> Result<(), DbError> {
    let mut conn = state.connection();
    let tx = conn.transaction()?;
    for (index, id) in ordered_ids.iter().enumerate() {
        let sort_order = i64::try_from(index).unwrap_or(i64::MAX);
        tx.execute(
            "UPDATE collections SET sort_order = ?1 WHERE id = ?2",
            params![sort_order, id],
        )?;
    }
    tx.commit()?;
    Ok(())
}
