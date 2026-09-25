use apiary_lib::database::{connection, migrations};

fn migrated_connection() -> rusqlite::Connection {
    let mut conn = connection::open_in_memory().expect("open in-memory db");
    migrations::run(&mut conn).expect("run migrations");
    conn
}

#[test]
fn migrations_create_every_expected_table() {
    let conn = migrated_connection();
    let mut stmt = conn
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .unwrap();
    let tables: Vec<String> = stmt
        .query_map([], |row| row.get(0))
        .unwrap()
        .collect::<rusqlite::Result<Vec<_>>>()
        .unwrap();

    for expected in [
        "collections",
        "requests",
        "environments",
        "environment_variables",
        "history",
        "open_tabs",
        "schema_migrations",
    ] {
        assert!(
            tables.iter().any(|t| t == expected),
            "expected table `{expected}` to exist, found: {tables:?}"
        );
    }
}

#[test]
fn migrations_are_idempotent() {
    let mut conn = connection::open_in_memory().expect("open in-memory db");
    migrations::run(&mut conn).expect("first run");
    // Running again must not error or re-apply anything.
    migrations::run(&mut conn).expect("second run should be a no-op");

    let applied_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM schema_migrations", [], |row| {
            row.get(0)
        })
        .unwrap();
    assert_eq!(applied_count, 2);
}

#[test]
fn collections_and_requests_round_trip() {
    let conn = migrated_connection();

    conn.execute(
        "INSERT INTO collections (id, name, sort_order, created_at, updated_at)
         VALUES ('c1', 'Users API', 0, 't0', 't0')",
        [],
    )
    .unwrap();

    conn.execute(
        "INSERT INTO requests
         (id, collection_id, name, method, url, params_json, headers_json, auth_json, body_json, sort_order, created_at, updated_at)
         VALUES ('r1', 'c1', 'Get Users', 'GET', 'https://api.example.com/users', '[]', '[]', '{\"type\":\"none\"}', '{\"type\":\"none\"}', 0, 't0', 't0')",
        [],
    )
    .unwrap();

    let (name, collection_id): (String, String) = conn
        .query_row(
            "SELECT name, collection_id FROM requests WHERE id = 'r1'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap();
    assert_eq!(name, "Get Users");
    assert_eq!(collection_id, "c1");
}

#[test]
fn deleting_a_collection_cascades_to_its_requests() {
    let conn = migrated_connection();
    conn.execute(
        "INSERT INTO collections (id, name, sort_order, created_at, updated_at)
         VALUES ('c1', 'Users API', 0, 't0', 't0')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO requests
         (id, collection_id, name, method, url, params_json, headers_json, auth_json, body_json, sort_order, created_at, updated_at)
         VALUES ('r1', 'c1', 'Get Users', 'GET', 'https://api.example.com/users', '[]', '[]', '{\"type\":\"none\"}', '{\"type\":\"none\"}', 0, 't0', 't0')",
        [],
    )
    .unwrap();

    conn.execute("DELETE FROM collections WHERE id = 'c1'", [])
        .unwrap();

    let remaining: i64 = conn
        .query_row("SELECT COUNT(*) FROM requests WHERE collection_id = 'c1'", [], |row| {
            row.get(0)
        })
        .unwrap();
    assert_eq!(remaining, 0);
}

#[test]
fn environment_variables_are_unique_per_key_within_an_environment() {
    let conn = migrated_connection();
    conn.execute(
        "INSERT INTO environments (id, name, is_active, created_at, updated_at)
         VALUES ('e1', 'Development', 1, 't0', 't0')",
        [],
    )
    .unwrap();
    conn.execute(
        "INSERT INTO environment_variables (id, environment_id, key, value, is_secret, sort_order)
         VALUES ('v1', 'e1', 'base_url', 'https://api.dev.example.com', 0, 0)",
        [],
    )
    .unwrap();

    let duplicate = conn.execute(
        "INSERT INTO environment_variables (id, environment_id, key, value, is_secret, sort_order)
         VALUES ('v2', 'e1', 'base_url', 'https://other.example.com', 0, 1)",
        [],
    );
    assert!(duplicate.is_err(), "expected a UNIQUE constraint violation");
}

#[test]
fn history_and_open_tabs_round_trip() {
    let conn = migrated_connection();

    conn.execute(
        "INSERT INTO history
         (id, method, url, params_json, headers_json, auth_json, body_json,
          status_code, duration_ms, response_size_bytes, response_headers_json, error_kind, executed_at)
         VALUES ('h1', 'GET', 'https://api.example.com/users', '[]', '[]', '{\"type\":\"none\"}', '{\"type\":\"none\"}',
                 200, 143, 2458, '[]', NULL, 't0')",
        [],
    )
    .unwrap();

    let status_code: i64 = conn
        .query_row("SELECT status_code FROM history WHERE id = 'h1'", [], |row| row.get(0))
        .unwrap();
    assert_eq!(status_code, 200);

    conn.execute(
        "INSERT INTO open_tabs
         (id, request_id, name, is_active, sort_order, draft_method, draft_url,
          draft_params_json, draft_headers_json, draft_auth_json, draft_body_json, is_dirty, updated_at)
         VALUES ('tab1', NULL, 'Untitled Request', 1, 0, 'GET', '',
                 '[]', '[]', '{\"type\":\"none\"}', '{\"type\":\"none\"}', 0, 't0')",
        [],
    )
    .unwrap();

    let tab_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM open_tabs", [], |row| row.get(0))
        .unwrap();
    assert_eq!(tab_count, 1);
}
