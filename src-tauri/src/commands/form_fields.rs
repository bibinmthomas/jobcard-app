use rusqlite::OptionalExtension;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::{AppError, Result};
use crate::state::{DbState, SessionState};

const VALID_TYPES: &[&str] = &["string", "number", "date", "multiselect"];

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FormField {
    pub id: i64,
    pub name: String,
    pub label: String,
    #[serde(rename = "type")]
    pub field_type: String,
    pub options: serde_json::Value,
    pub required: bool,
    #[serde(rename = "order")]
    pub display_order: i64,
    pub is_deleted: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormFieldInput {
    pub name: Option<String>,
    pub label: Option<String>,
    #[serde(rename = "type")]
    pub field_type: Option<String>,
    pub options: Option<serde_json::Value>,
    pub required: Option<bool>,
    #[serde(rename = "order")]
    pub display_order: Option<i64>,
}

fn map_form_field(row: &rusqlite::Row<'_>) -> rusqlite::Result<FormField> {
    let opts_str: Option<String> = row.get("options")?;
    let options: serde_json::Value = opts_str
        .as_deref()
        .and_then(|s| serde_json::from_str(s).ok())
        .unwrap_or(serde_json::Value::Null);

    Ok(FormField {
        id: row.get("id")?,
        name: row.get("name")?,
        label: row.get("label")?,
        field_type: row.get("field_type")?,
        options,
        required: row.get::<_, i32>("required")? != 0,
        display_order: row.get("display_order")?,
        is_deleted: row.get::<_, i32>("is_deleted")? != 0,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

#[tauri::command]
pub fn form_fields_list(db: State<'_, DbState>) -> Result<Vec<FormField>> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, name, label, field_type, options, required, display_order,
                is_deleted, created_at, updated_at
         FROM form_fields WHERE is_deleted = 0 ORDER BY display_order ASC",
    )?;
    let rows = stmt
        .query_map([], map_form_field)?
        .collect::<rusqlite::Result<Vec<FormField>>>()?;
    Ok(rows)
}

#[tauri::command]
pub fn form_fields_create(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    data: FormFieldInput,
) -> Result<FormField> {
    if session.0.lock().unwrap().is_none() {
        return Err(AppError("Not authenticated".to_string()));
    }

    let name = data
        .name
        .as_deref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| AppError("Field name is required".to_string()))?;

    let label = data
        .label
        .as_deref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| AppError("Field label is required".to_string()))?;

    let field_type = data
        .field_type
        .as_deref()
        .unwrap_or("string")
        .to_string();

    if !VALID_TYPES.contains(&field_type.as_str()) {
        return Err(AppError(format!(
            "Invalid field type. Must be one of: {}",
            VALID_TYPES.join(", ")
        )));
    }

    let opts_json = if field_type == "multiselect" {
        let opts = data.options.as_ref().and_then(|v| v.as_array()).cloned();
        match opts {
            Some(arr) if !arr.is_empty() => {
                Some(serde_json::to_string(&arr)?)
            }
            _ => return Err(AppError("Multiselect fields require at least one option".to_string())),
        }
    } else {
        None
    };

    let normalized_name = name.replace(' ', "_").to_lowercase();
    let order = data.display_order.unwrap_or(0);
    let required = data.required.unwrap_or(false);

    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO form_fields (name, label, field_type, options, required, display_order)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![normalized_name, label, field_type, opts_json, required as i32, order],
    )?;

    let id = conn.last_insert_rowid();
    let field = conn.query_row(
        "SELECT id, name, label, field_type, options, required, display_order,
                is_deleted, created_at, updated_at
         FROM form_fields WHERE id = ?1",
        rusqlite::params![id],
        map_form_field,
    )?;
    Ok(field)
}

#[tauri::command]
pub fn form_fields_update(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    id: i64,
    data: FormFieldInput,
) -> Result<FormField> {
    if session.0.lock().unwrap().is_none() {
        return Err(AppError("Not authenticated".to_string()));
    }

    let conn = db.0.lock().unwrap();

    let current: (String, String, Option<String>, i32, i64) = conn.query_row(
        "SELECT label, field_type, options, required, display_order FROM form_fields WHERE id = ?1",
        rusqlite::params![id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
    ).optional()?.ok_or_else(|| AppError("Form field not found".to_string()))?;

    let new_type = data.field_type.as_deref().unwrap_or(&current.1).to_string();
    if !VALID_TYPES.contains(&new_type.as_str()) {
        return Err(AppError(format!(
            "Invalid field type. Must be one of: {}",
            VALID_TYPES.join(", ")
        )));
    }

    let new_opts = if new_type == "multiselect" {
        data.options
            .as_ref()
            .map(|v| serde_json::to_string(v).ok())
            .flatten()
            .or(current.2)
    } else {
        None
    };

    let new_label = data.label.as_deref().unwrap_or(&current.0).trim().to_string();
    let new_required = data.required.map(|r| r as i32).unwrap_or(current.3);
    let new_order = data.display_order.unwrap_or(current.4);

    conn.execute(
        "UPDATE form_fields SET label=?1, field_type=?2, options=?3, required=?4,
                 display_order=?5, updated_at=datetime('now')
         WHERE id=?6",
        rusqlite::params![new_label, new_type, new_opts, new_required, new_order, id],
    )?;

    let field = conn.query_row(
        "SELECT id, name, label, field_type, options, required, display_order,
                is_deleted, created_at, updated_at
         FROM form_fields WHERE id = ?1",
        rusqlite::params![id],
        map_form_field,
    )?;
    Ok(field)
}

#[tauri::command]
pub fn form_fields_delete(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    id: i64,
) -> Result<serde_json::Value> {
    if session.0.lock().unwrap().is_none() {
        return Err(AppError("Not authenticated".to_string()));
    }
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE form_fields SET is_deleted=1, updated_at=datetime('now') WHERE id=?1",
        rusqlite::params![id],
    )?;
    Ok(serde_json::json!({ "success": true }))
}
