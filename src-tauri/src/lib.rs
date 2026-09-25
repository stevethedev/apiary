pub mod commands;
pub mod database;
pub mod http;
pub mod models;

use tauri::Manager;

use commands::collections::{
    create_collection, delete_collection, list_collections, rename_collection,
    reorder_collections,
};
use commands::environments::{
    clear_active_environment, create_environment, delete_environment, list_environments,
    set_active_environment, set_environment_variables, update_environment,
};
use commands::history::{append_history, clear_history, list_history};
use commands::http::{cancel_request, send_request};
use commands::requests::{
    create_request, delete_request, duplicate_request, get_request, list_requests,
    reorder_requests, update_request,
};
use commands::tabs::{load_open_tabs, save_open_tabs};
use database::{connection, migrations, DbState};
use http::HttpState;

/// # Panics
///
/// Panics if the app data directory can't be created, the database can't
/// be opened or migrated, or the Tauri runtime fails to start — any of
/// which leaves the app unusable, so failing fast at startup is intentional.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(HttpState::default())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            let db_path = app_data_dir.join("apiary.sqlite3");
            let mut conn = connection::open(&db_path)?;
            migrations::run(&mut conn)?;
            app.manage(DbState::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            send_request,
            cancel_request,
            list_collections,
            create_collection,
            rename_collection,
            delete_collection,
            reorder_collections,
            list_requests,
            get_request,
            create_request,
            update_request,
            duplicate_request,
            delete_request,
            reorder_requests,
            list_environments,
            create_environment,
            update_environment,
            delete_environment,
            set_active_environment,
            clear_active_environment,
            set_environment_variables,
            append_history,
            list_history,
            clear_history,
            load_open_tabs,
            save_open_tabs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
