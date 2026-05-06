use serde::Serialize;
use tauri::State;

use crate::error::{AppError, Result};
use crate::state::{DbState, SessionState};

#[derive(Serialize)]
pub struct TableStats {
    pub total: i64,
    pub active: i64,
    pub deleted: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DbStats {
    pub job_cards: TableStats,
    pub accounts: TableStats,
    pub form_fields: TableStats,
}

fn count(conn: &rusqlite::Connection, sql: &str) -> i64 {
    conn.query_row(sql, [], |row| row.get(0)).unwrap_or(0)
}

#[tauri::command]
pub fn db_get_stats(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
) -> Result<DbStats> {
    session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;

    let conn = db.0.lock().unwrap();

    let jc_total = count(&conn, "SELECT COUNT(*) FROM job_cards");
    let jc_del   = count(&conn, "SELECT COUNT(*) FROM job_cards WHERE is_deleted=1");
    let ac_total = count(&conn, "SELECT COUNT(*) FROM accounts");
    let ac_del   = count(&conn, "SELECT COUNT(*) FROM accounts WHERE is_deleted=1");
    let ff_total = count(&conn, "SELECT COUNT(*) FROM form_fields");
    let ff_del   = count(&conn, "SELECT COUNT(*) FROM form_fields WHERE is_deleted=1");

    Ok(DbStats {
        job_cards:   TableStats { total: jc_total, active: jc_total - jc_del, deleted: jc_del },
        accounts:    TableStats { total: ac_total, active: ac_total - ac_del, deleted: ac_del },
        form_fields: TableStats { total: ff_total, active: ff_total - ff_del, deleted: ff_del },
    })
}

#[tauri::command]
pub fn db_clear_deleted(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
) -> Result<serde_json::Value> {
    session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;

    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM job_cards WHERE is_deleted=1", [])?;
    conn.execute("DELETE FROM form_fields WHERE is_deleted=1", [])?;
    conn.execute("DELETE FROM accounts WHERE is_deleted=1", [])?;
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
pub fn db_clear_all(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
) -> Result<serde_json::Value> {
    session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;

    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM job_cards", [])?;
    conn.execute("DELETE FROM form_fields", [])?;
    conn.execute("DELETE FROM accounts", [])?;
    Ok(serde_json::json!({ "success": true }))
}
