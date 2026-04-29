use std::collections::HashMap;

use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use crate::error::Result;
use crate::state::DbState;

#[derive(Debug, Serialize)]
pub struct SettingRecord {
    pub key: String,
    pub value: serde_json::Value,
}

fn default_export_path(app: &AppHandle) -> String {
    app.path()
        .app_data_dir()
        .map(|p| p.join("pdf-exports").to_string_lossy().to_string())
        .unwrap_or_default()
}

fn default_settings(app: &AppHandle) -> HashMap<String, serde_json::Value> {
    let mut m = HashMap::new();
    m.insert(
        "exportPath".to_string(),
        serde_json::Value::String(default_export_path(app)),
    );
    m.insert(
        "theme".to_string(),
        serde_json::Value::String("system".to_string()),
    );
    m
}

#[tauri::command]
pub fn settings_get(
    db: State<'_, DbState>,
    app: AppHandle,
    key: String,
) -> Result<Option<SettingRecord>> {
    use rusqlite::OptionalExtension;
    let conn = db.0.lock().unwrap();

    let raw: Option<String> = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = ?1",
            rusqlite::params![key],
            |row| row.get(0),
        )
        .optional()?;

    match raw {
        Some(json_str) => {
            let value: serde_json::Value = serde_json::from_str(&json_str)?;
            Ok(Some(SettingRecord { key, value }))
        }
        None => {
            let defaults = default_settings(&app);
            Ok(defaults.get(&key).map(|v| SettingRecord {
                key: key.clone(),
                value: v.clone(),
            }))
        }
    }
}

#[tauri::command]
pub fn settings_get_all(
    db: State<'_, DbState>,
    app: AppHandle,
) -> Result<HashMap<String, SettingRecord>> {
    let conn = db.0.lock().unwrap();
    let mut map: HashMap<String, SettingRecord> = HashMap::new();

    for (k, v) in default_settings(&app) {
        map.insert(k.clone(), SettingRecord { key: k, value: v });
    }

    let mut stmt = conn.prepare("SELECT key, value FROM app_settings")?;
    let rows = stmt.query_map([], |row| {
        let k: String = row.get(0)?;
        let v: String = row.get(1)?;
        Ok((k, v))
    })?;

    for row in rows.flatten() {
        let (k, v_str) = row;
        if let Ok(value) = serde_json::from_str::<serde_json::Value>(&v_str) {
            map.insert(k.clone(), SettingRecord { key: k, value });
        }
    }

    Ok(map)
}

#[tauri::command]
pub fn settings_set(
    db: State<'_, DbState>,
    key: String,
    value: serde_json::Value,
) -> Result<SettingRecord> {
    let json_str = serde_json::to_string(&value)?;
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO app_settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value=?2, updated_at=datetime('now')",
        rusqlite::params![key, json_str],
    )?;
    Ok(SettingRecord { key, value })
}

#[tauri::command]
pub fn settings_get_export_path(db: State<'_, DbState>, app: AppHandle) -> Result<String> {
    use rusqlite::OptionalExtension;
    let conn = db.0.lock().unwrap();

    let raw: Option<String> = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = 'exportPath'",
            [],
            |row| row.get(0),
        )
        .optional()?;

    match raw {
        Some(json_str) => {
            if let Ok(serde_json::Value::String(p)) = serde_json::from_str(&json_str) {
                return Ok(p);
            }
            Ok(default_export_path(&app))
        }
        None => Ok(default_export_path(&app)),
    }
}
