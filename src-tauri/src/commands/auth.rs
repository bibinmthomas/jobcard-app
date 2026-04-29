use rusqlite::OptionalExtension;
use tauri::State;

use crate::error::{AppError, Result};
use crate::state::{DbState, SessionState, UserSession};

#[tauri::command]
pub fn auth_has_users(db: State<'_, DbState>) -> Result<bool> {
    let conn = db.0.lock().unwrap();
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users WHERE is_deleted = 0",
        [],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

#[tauri::command]
pub fn auth_register(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    username: String,
    password: String,
) -> Result<UserSession> {
    if username.trim().len() < 3 {
        return Err(AppError("Username must be at least 3 characters".to_string()));
    }
    if password.len() < 6 {
        return Err(AppError("Password must be at least 6 characters".to_string()));
    }

    let trimmed = username.trim().to_string();
    let conn = db.0.lock().unwrap();

    let existing: Option<i64> = conn
        .query_row(
            "SELECT id FROM users WHERE username = ?1 AND is_deleted = 0",
            rusqlite::params![trimmed],
            |row| row.get(0),
        )
        .optional()?;

    if existing.is_some() {
        return Err(AppError("Username already taken".to_string()));
    }

    let hash = bcrypt::hash(&password, 10)?;

    let user_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users WHERE is_deleted = 0",
        [],
        |row| row.get(0),
    )?;
    let role = if user_count == 0 { "admin" } else { "user" };

    conn.execute(
        "INSERT INTO users (username, password, role) VALUES (?1, ?2, ?3)",
        rusqlite::params![trimmed, hash, role],
    )?;

    let id = conn.last_insert_rowid();
    let sess = UserSession {
        id,
        username: trimmed,
        role: role.to_string(),
    };

    *session.0.lock().unwrap() = Some(sess.clone());
    log::info!("[auth:register] User registered: {} ({})", sess.username, sess.role);
    Ok(sess)
}

#[tauri::command]
pub fn auth_login(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    username: String,
    password: String,
) -> Result<UserSession> {
    if username.is_empty() || password.is_empty() {
        return Err(AppError("Username and password are required".to_string()));
    }

    let conn = db.0.lock().unwrap();

    let row: Option<(i64, String, String, String)> = conn
        .query_row(
            "SELECT id, username, password, role FROM users WHERE username = ?1 AND is_deleted = 0",
            rusqlite::params![username.trim()],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .optional()?;

    let (id, uname, hash, role) = row.ok_or_else(|| AppError("Invalid credentials".to_string()))?;

    let valid = bcrypt::verify(&password, &hash)?;
    if !valid {
        return Err(AppError("Invalid credentials".to_string()));
    }

    let sess = UserSession { id, username: uname, role };
    *session.0.lock().unwrap() = Some(sess.clone());
    log::info!("[auth:login] User logged in: {}", sess.username);
    Ok(sess)
}

#[tauri::command]
pub fn auth_logout(session: State<'_, SessionState>) -> Result<serde_json::Value> {
    let mut s = session.0.lock().unwrap();
    log::info!("[auth:logout] User logged out: {:?}", s.as_ref().map(|u| &u.username));
    *s = None;
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
pub fn auth_get_session(session: State<'_, SessionState>) -> Result<Option<UserSession>> {
    Ok(session.0.lock().unwrap().clone())
}
