use std::path::PathBuf;

use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use crate::error::{AppError, Result};
use crate::state::{DbState, SessionState};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfSaveResult {
    pub success: bool,
    pub path: String,
}

pub fn resolve_export_dir(db: &DbState, app: &AppHandle) -> Result<PathBuf> {
    let conn = db.0.lock().unwrap();
    let setting: Option<String> = {
        use rusqlite::OptionalExtension;
        conn.query_row(
            "SELECT value FROM app_settings WHERE key = 'exportPath'",
            [],
            |row| row.get(0),
        )
        .optional()
        .unwrap_or(None)
    };

    if let Some(json_str) = setting {
        if let Ok(serde_json::Value::String(path_str)) = serde_json::from_str::<serde_json::Value>(&json_str) {
            if !path_str.is_empty() {
                return Ok(PathBuf::from(path_str));
            }
        }
    }

    let docs = app
        .path()
        .document_dir()
        .map_err(|e| AppError(format!("Cannot resolve documents dir: {:?}", e)))?;
    Ok(docs.join("JobCardExports"))
}

#[tauri::command]
pub fn pdf_save_to_disk(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    app: AppHandle,
    filename: String,
    bytes: Vec<u8>,
) -> Result<PdfSaveResult> {
    if session.0.lock().unwrap().is_none() {
        return Err(AppError("Not authenticated".to_string()));
    }

    let export_dir = resolve_export_dir(&db, &app)?;
    std::fs::create_dir_all(&export_dir)?;

    let file_path = export_dir.join(&filename);
    std::fs::write(&file_path, &bytes)?;

    let path_str = file_path.to_string_lossy().to_string();
    log::info!("[pdf:saveToDisk] Saved: {}", path_str);
    Ok(PdfSaveResult { success: true, path: path_str })
}

#[tauri::command]
pub fn pdf_get_export_dir(db: State<'_, DbState>, app: AppHandle) -> Result<String> {
    let dir = resolve_export_dir(&db, &app)?;
    Ok(dir.to_string_lossy().to_string())
}
