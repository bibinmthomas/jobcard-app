use serde::Serialize;
use tauri::State;

use crate::error::Result;
use crate::state::DbState;

#[derive(Serialize)]
pub struct TableStats {
    pub total: i64,
    pub active: i64,
    pub deleted: i64,
}

#[derive(Serialize)]
pub struct UserStats {
    pub total: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DbStats {
    pub job_cards: TableStats,
    pub accounts: TableStats,
    pub form_fields: TableStats,
    pub users: UserStats,
}

fn count(conn: &rusqlite::Connection, sql: &str) -> i64 {
    conn.query_row(sql, [], |row| row.get(0)).unwrap_or(0)
}

#[tauri::command]
pub fn db_get_stats(db: State<'_, DbState>) -> Result<DbStats> {
    let conn = db.0.lock().unwrap();

    let jc_total = count(&conn, "SELECT COUNT(*) FROM job_cards");
    let jc_del = count(&conn, "SELECT COUNT(*) FROM job_cards WHERE is_deleted=1");
    let ac_total = count(&conn, "SELECT COUNT(*) FROM accounts");
    let ac_del = count(&conn, "SELECT COUNT(*) FROM accounts WHERE is_deleted=1");
    let ff_total = count(&conn, "SELECT COUNT(*) FROM form_fields");
    let ff_del = count(&conn, "SELECT COUNT(*) FROM form_fields WHERE is_deleted=1");
    let users = count(&conn, "SELECT COUNT(*) FROM users WHERE is_deleted=0");

    Ok(DbStats {
        job_cards: TableStats { total: jc_total, active: jc_total - jc_del, deleted: jc_del },
        accounts: TableStats { total: ac_total, active: ac_total - ac_del, deleted: ac_del },
        form_fields: TableStats { total: ff_total, active: ff_total - ff_del, deleted: ff_del },
        users: UserStats { total: users },
    })
}

#[tauri::command]
pub fn db_clear_deleted(db: State<'_, DbState>) -> Result<serde_json::Value> {
    let conn = db.0.lock().unwrap();
    conn.execute_batch("
        BEGIN;
        DELETE FROM job_cards WHERE is_deleted=1;
        DELETE FROM form_fields WHERE is_deleted=1;
        DELETE FROM accounts WHERE is_deleted=1;
        COMMIT;
    ")?;
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
pub fn db_clear_all(db: State<'_, DbState>) -> Result<serde_json::Value> {
    let conn = db.0.lock().unwrap();
    conn.execute_batch("
        BEGIN;
        DELETE FROM job_cards;
        DELETE FROM form_fields;
        DELETE FROM accounts;
        COMMIT;
    ")?;
    Ok(serde_json::json!({ "success": true }))
}
