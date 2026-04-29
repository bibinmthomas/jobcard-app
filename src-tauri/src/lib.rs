mod commands;
mod db;
mod error;
mod state;

use std::sync::Mutex;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data directory");
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data directory");

            let db_path = app_data_dir.join("jobcards.db");
            let conn = rusqlite::Connection::open(&db_path)
                .expect("Failed to open database");

            db::initialize_schema(&conn).expect("Failed to initialize database schema");

            app.manage(state::DbState(Mutex::new(conn)));
            app.manage(state::SessionState(Mutex::new(None)));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth::auth_has_users,
            commands::auth::auth_register,
            commands::auth::auth_login,
            commands::auth::auth_logout,
            commands::auth::auth_get_session,
            commands::jobcards::jobcards_list,
            commands::jobcards::jobcards_get,
            commands::jobcards::jobcards_create,
            commands::jobcards::jobcards_update,
            commands::jobcards::jobcards_delete,
            commands::accounts::accounts_list,
            commands::accounts::accounts_get,
            commands::accounts::accounts_create,
            commands::accounts::accounts_update,
            commands::accounts::accounts_delete,
            commands::form_fields::form_fields_list,
            commands::form_fields::form_fields_create,
            commands::form_fields::form_fields_update,
            commands::form_fields::form_fields_delete,
            commands::pdf::pdf_save_to_disk,
            commands::pdf::pdf_get_export_dir,
            commands::file_system::fs_read_file,
            commands::file_system::fs_write_file,
            commands::settings::settings_get,
            commands::settings::settings_get_all,
            commands::settings::settings_set,
            commands::settings::settings_get_export_path,
            commands::database::db_get_stats,
            commands::database::db_clear_deleted,
            commands::database::db_clear_all,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
