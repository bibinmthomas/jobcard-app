use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::Serialize;

use crate::error::{AppError, Result};

#[derive(Serialize)]
pub struct FsReadResult {
    pub success: bool,
    pub data: String,
}

#[derive(Serialize)]
pub struct SuccessResult {
    pub success: bool,
}

#[tauri::command]
pub fn fs_read_file(file_path: String) -> Result<FsReadResult> {
    let bytes = std::fs::read(&file_path)?;
    let data = STANDARD.encode(&bytes);
    Ok(FsReadResult { success: true, data })
}

#[tauri::command]
pub fn fs_write_file(file_path: String, data: String) -> Result<SuccessResult> {
    let bytes = STANDARD
        .decode(&data)
        .map_err(|e| AppError(format!("Base64 decode error: {}", e)))?;
    std::fs::write(&file_path, bytes)?;
    Ok(SuccessResult { success: true })
}
