use std::path::Path;

use rusqlite::Connection;

/// # Errors
///
/// Returns an error if the file can't be opened or the startup pragmas
/// can't be applied.
pub fn open(path: &Path) -> rusqlite::Result<Connection> {
    let conn = Connection::open(path)?;
    configure(&conn)?;
    Ok(conn)
}

/// Used by tests to exercise migrations/queries without touching disk.
///
/// # Errors
///
/// Returns an error if the startup pragmas can't be applied.
pub fn open_in_memory() -> rusqlite::Result<Connection> {
    let conn = Connection::open_in_memory()?;
    configure(&conn)?;
    Ok(conn)
}

fn configure(conn: &Connection) -> rusqlite::Result<()> {
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    Ok(())
}
