use rusqlite::OptionalExtension;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::{AppError, Result};
use crate::state::{DbState, SessionState};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub id: i64,
    pub acct_name: String,
    pub address: Option<String>,
    pub city: Option<String>,
    pub pin: Option<String>,
    pub fax: Option<String>,
    pub telex: Option<String>,
    pub contact_person: Option<String>,
    pub user_id: Option<i64>,
    pub is_deleted: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountInput {
    pub acct_name: String,
    pub address: Option<String>,
    pub city: Option<String>,
    pub pin: Option<String>,
    pub fax: Option<String>,
    pub telex: Option<String>,
    pub contact_person: Option<String>,
}

fn map_account(row: &rusqlite::Row<'_>) -> rusqlite::Result<Account> {
    Ok(Account {
        id: row.get("id")?,
        acct_name: row.get("acct_name")?,
        address: row.get("address")?,
        city: row.get("city")?,
        pin: row.get("pin")?,
        fax: row.get("fax")?,
        telex: row.get("telex")?,
        contact_person: row.get("contact_person")?,
        user_id: row.get("user_id")?,
        is_deleted: row.get::<_, i32>("is_deleted")? != 0,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

#[tauri::command]
pub fn accounts_list(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
) -> Result<Vec<Account>> {
    let sess = session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, acct_name, address, city, pin, fax, telex, contact_person,
                user_id, is_deleted, created_at, updated_at
         FROM accounts WHERE is_deleted = 0 AND user_id = ?1 ORDER BY acct_name ASC",
    )?;
    let rows = stmt
        .query_map(rusqlite::params![sess.id], map_account)?
        .collect::<rusqlite::Result<Vec<Account>>>()?;
    Ok(rows)
}

#[tauri::command]
pub fn accounts_get(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    id: i64,
) -> Result<Option<Account>> {
    let sess = session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;
    let conn = db.0.lock().unwrap();
    let result = conn
        .query_row(
            "SELECT id, acct_name, address, city, pin, fax, telex, contact_person,
                    user_id, is_deleted, created_at, updated_at
             FROM accounts WHERE id = ?1 AND user_id = ?2 AND is_deleted = 0",
            rusqlite::params![id, sess.id],
            map_account,
        )
        .optional()?;
    Ok(result)
}

#[tauri::command]
pub fn accounts_create(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    data: AccountInput,
) -> Result<Account> {
    let sess = session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;
    let name = data.acct_name.trim().to_string();
    if name.is_empty() {
        return Err(AppError("Account name is required".to_string()));
    }

    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO accounts (acct_name, address, city, pin, fax, telex, contact_person, user_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![
            name,
            data.address,
            data.city,
            data.pin,
            data.fax,
            data.telex,
            data.contact_person,
            sess.id
        ],
    )?;

    let id = conn.last_insert_rowid();
    let account = conn.query_row(
        "SELECT id, acct_name, address, city, pin, fax, telex, contact_person,
                user_id, is_deleted, created_at, updated_at
         FROM accounts WHERE id = ?1",
        rusqlite::params![id],
        map_account,
    )?;
    Ok(account)
}

#[tauri::command]
pub fn accounts_update(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    id: i64,
    data: AccountInput,
) -> Result<Account> {
    let sess = session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;
    let name = data.acct_name.trim().to_string();
    if name.is_empty() {
        return Err(AppError("Account name is required".to_string()));
    }

    let conn = db.0.lock().unwrap();

    let owner: Option<i64> = conn
        .query_row(
            "SELECT user_id FROM accounts WHERE id = ?1 AND is_deleted = 0",
            rusqlite::params![id],
            |row| row.get(0),
        )
        .optional()?
        .flatten();

    if owner != Some(sess.id) {
        return Err(AppError("Account not found or permission denied".to_string()));
    }

    conn.execute(
        "UPDATE accounts SET acct_name=?1, address=?2, city=?3, pin=?4, fax=?5,
                 telex=?6, contact_person=?7, updated_at=datetime('now')
         WHERE id=?8 AND user_id=?9",
        rusqlite::params![
            name,
            data.address,
            data.city,
            data.pin,
            data.fax,
            data.telex,
            data.contact_person,
            id,
            sess.id
        ],
    )?;

    let account = conn.query_row(
        "SELECT id, acct_name, address, city, pin, fax, telex, contact_person,
                user_id, is_deleted, created_at, updated_at
         FROM accounts WHERE id = ?1",
        rusqlite::params![id],
        map_account,
    )?;
    Ok(account)
}

#[tauri::command]
pub fn accounts_delete(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    id: i64,
) -> Result<serde_json::Value> {
    let sess = session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;

    let conn = db.0.lock().unwrap();

    let owner: Option<i64> = conn
        .query_row(
            "SELECT user_id FROM accounts WHERE id = ?1 AND is_deleted = 0",
            rusqlite::params![id],
            |row| row.get(0),
        )
        .optional()?
        .flatten();

    if owner != Some(sess.id) {
        return Err(AppError("Account not found or permission denied".to_string()));
    }

    let active_cards: i64 = conn.query_row(
        "SELECT COUNT(*) FROM job_cards WHERE account_id = ?1 AND is_deleted = 0",
        rusqlite::params![id],
        |row| row.get(0),
    )?;
    if active_cards > 0 {
        return Err(AppError(
            "Cannot delete an account that has active job cards".to_string(),
        ));
    }

    conn.execute(
        "UPDATE accounts SET is_deleted=1, updated_at=datetime('now') WHERE id=?1 AND user_id=?2",
        rusqlite::params![id, sess.id],
    )?;
    Ok(serde_json::json!({ "success": true }))
}
