use rusqlite::OptionalExtension;
use tauri::State;

use crate::error::{AppError, Result};
use crate::state::{DbState, SessionState, UserSession};

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginResult {
    pub needs_reset: bool,
    pub is_expired: bool,
}

#[tauri::command]
pub fn auth_login(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    password: String,
) -> Result<LoginResult> {
    if password.is_empty() {
        return Err(AppError("Password is required".to_string()));
    }

    let conn = db.0.lock().unwrap();
    let row = conn
        .query_row(
            "SELECT password_hash, is_default_password, password_expires_at FROM app_auth WHERE id = 1",
            [],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?, row.get::<_, Option<String>>(2)?)),
        )
        .optional()?
        .ok_or_else(|| AppError("Authentication not configured".to_string()))?;

    let (hash, is_default, expires_at) = row;

    if !bcrypt::verify(&password, &hash)? {
        return Err(AppError("Invalid password".to_string()));
    }

    *session.0.lock().unwrap() = Some(UserSession { authenticated: true });
    log::info!("[auth:login] Login successful");

    let needs_reset = is_default != 0;

    let is_expired = if needs_reset {
        false
    } else {
        match expires_at.as_deref() {
            Some(exp) => {
                let expires = chrono::DateTime::parse_from_rfc3339(exp)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now());
                chrono::Utc::now() > expires
            }
            None => false,
        }
    };

    Ok(LoginResult { needs_reset, is_expired })
}

/// Called on first login: replaces the default password with a user-chosen one.
/// Requires an active session (user must have passed login first).
#[tauri::command]
pub fn auth_reset_password(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    new_password: String,
) -> Result<serde_json::Value> {
    session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;

    if new_password.len() < 6 {
        return Err(AppError("Password must be at least 6 characters".to_string()));
    }

    let hash = bcrypt::hash(&new_password, 10)?;
    let expires_at = (chrono::Utc::now() + chrono::Duration::days(365)).to_rfc3339();

    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE app_auth SET password_hash=?1, is_default_password=0,
                 password_set_at=datetime('now'), password_expires_at=?2
         WHERE id=1",
        rusqlite::params![hash, expires_at],
    )?;

    log::info!("[auth:reset_password] Password set by user");
    Ok(serde_json::json!({ "success": true }))
}

/// Called when the current password has expired: verifies the old password, then sets a new one.
/// Requires an active session (user must have passed login first).
#[tauri::command]
pub fn auth_change_expired_password(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    old_password: String,
    new_password: String,
) -> Result<serde_json::Value> {
    session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;

    if new_password.len() < 6 {
        return Err(AppError("Password must be at least 6 characters".to_string()));
    }

    let conn = db.0.lock().unwrap();
    let current_hash: String = conn.query_row(
        "SELECT password_hash FROM app_auth WHERE id = 1",
        [],
        |row| row.get(0),
    )?;

    if !bcrypt::verify(&old_password, &current_hash)? {
        return Err(AppError("Current password is incorrect".to_string()));
    }

    let hash = bcrypt::hash(&new_password, 10)?;
    let expires_at = (chrono::Utc::now() + chrono::Duration::days(365)).to_rfc3339();

    conn.execute(
        "UPDATE app_auth SET password_hash=?1, is_default_password=0,
                 password_set_at=datetime('now'), password_expires_at=?2
         WHERE id=1",
        rusqlite::params![hash, expires_at],
    )?;

    log::info!("[auth:change_expired_password] Password renewed after expiry");
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
pub fn auth_logout(session: State<'_, SessionState>) -> Result<serde_json::Value> {
    let mut s = session.0.lock().unwrap();
    log::info!("[auth:logout] User logged out");
    *s = None;
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
pub fn auth_get_session(session: State<'_, SessionState>) -> Result<Option<UserSession>> {
    Ok(session.0.lock().unwrap().clone())
}
