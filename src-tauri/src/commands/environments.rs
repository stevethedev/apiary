use rusqlite::params;
use tauri::State;

use crate::database::{new_id, now, DbError, DbState};
use crate::models::environment::{Environment, EnvironmentVariable};

fn load_variables(
    conn: &rusqlite::Connection,
    environment_id: &str,
) -> rusqlite::Result<Vec<EnvironmentVariable>> {
    let mut stmt = conn.prepare(
        "SELECT id, key, value, is_secret, sort_order FROM environment_variables
         WHERE environment_id = ?1 ORDER BY sort_order",
    )?;
    let rows = stmt
        .query_map(params![environment_id], |row| {
            Ok(EnvironmentVariable {
                id: row.get("id")?,
                key: row.get("key")?,
                value: row.get("value")?,
                is_secret: row.get("is_secret")?,
                sort_order: row.get("sort_order")?,
            })
        })?
        .collect();
    rows
}

fn load_environment(conn: &rusqlite::Connection, id: &str) -> Result<Environment, DbError> {
    let (name, is_active, created_at, updated_at): (String, bool, String, String) = conn
        .query_row(
            "SELECT name, is_active, created_at, updated_at FROM environments WHERE id = ?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )?;
    Ok(Environment {
        id: id.to_string(),
        name,
        is_active,
        variables: load_variables(conn, id)?,
        created_at,
        updated_at,
    })
}

/// # Errors
///
/// Returns [`DbError`] if the underlying query fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn list_environments(state: State<'_, DbState>) -> Result<Vec<Environment>, DbError> {
    let conn = state.connection();
    let mut stmt = conn.prepare("SELECT id FROM environments ORDER BY created_at")?;
    let ids: Vec<String> = stmt
        .query_map([], |row| row.get(0))?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    ids.iter().map(|id| load_environment(&conn, id)).collect()
}

/// # Errors
///
/// Returns [`DbError`] if the underlying insert fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn create_environment(
    state: State<'_, DbState>,
    name: String,
) -> Result<Environment, DbError> {
    let conn = state.connection();
    let id = new_id();
    let timestamp = now();
    conn.execute(
        "INSERT INTO environments (id, name, is_active, created_at, updated_at)
         VALUES (?1, ?2, 0, ?3, ?3)",
        params![id, name, timestamp],
    )?;
    Ok(Environment {
        id,
        name,
        is_active: false,
        variables: vec![],
        created_at: timestamp.clone(),
        updated_at: timestamp,
    })
}

/// # Errors
///
/// Returns [`DbError`] if the underlying update or reload fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn update_environment(
    state: State<'_, DbState>,
    id: String,
    name: String,
) -> Result<Environment, DbError> {
    let conn = state.connection();
    conn.execute(
        "UPDATE environments SET name = ?1, updated_at = ?2 WHERE id = ?3",
        params![name, now(), id],
    )?;
    load_environment(&conn, &id)
}

/// # Errors
///
/// Returns [`DbError`] if the underlying delete fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn delete_environment(state: State<'_, DbState>, id: String) -> Result<(), DbError> {
    let conn = state.connection();
    conn.execute("DELETE FROM environments WHERE id = ?1", params![id])?;
    Ok(())
}

/// # Errors
///
/// Returns [`DbError`] if the underlying update fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn set_active_environment(state: State<'_, DbState>, id: String) -> Result<(), DbError> {
    let conn = state.connection();
    conn.execute("UPDATE environments SET is_active = 0", [])?;
    conn.execute(
        "UPDATE environments SET is_active = 1, updated_at = ?1 WHERE id = ?2",
        params![now(), id],
    )?;
    Ok(())
}

/// Deactivates every environment, leaving the request builder with no
/// active environment (so `{{variables}}` resolve against nothing, which
/// surfaces as the usual "undefined variable" block on Send).
///
/// # Errors
///
/// Returns [`DbError`] if the underlying update fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn clear_active_environment(state: State<'_, DbState>) -> Result<(), DbError> {
    let conn = state.connection();
    conn.execute("UPDATE environments SET is_active = 0", [])?;
    Ok(())
}

/// # Errors
///
/// Returns [`DbError`] if the transaction fails to commit or the reload
/// afterward fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn set_environment_variables(
    state: State<'_, DbState>,
    environment_id: String,
    variables: Vec<EnvironmentVariable>,
) -> Result<Environment, DbError> {
    let mut conn = state.connection();
    let tx = conn.transaction()?;
    tx.execute(
        "DELETE FROM environment_variables WHERE environment_id = ?1",
        params![environment_id],
    )?;
    for (index, variable) in variables.iter().enumerate() {
        let sort_order = i64::try_from(index).unwrap_or(i64::MAX);
        tx.execute(
            "INSERT INTO environment_variables (id, environment_id, key, value, is_secret, sort_order)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                variable.id,
                environment_id,
                variable.key,
                variable.value,
                variable.is_secret,
                sort_order,
            ],
        )?;
    }
    tx.execute(
        "UPDATE environments SET updated_at = ?1 WHERE id = ?2",
        params![now(), environment_id],
    )?;
    tx.commit()?;
    load_environment(&conn, &environment_id)
}
