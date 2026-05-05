use rusqlite::OptionalExtension;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::{AppError, Result};
use crate::state::{DbState, SessionState};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountRef {
    pub id: i64,
    pub acct_name: String,
    pub address: Option<String>,
    pub city: Option<String>,
    pub pin: Option<String>,
    pub fax: Option<String>,
    pub telex: Option<String>,
    pub contact_person: Option<String>,
    pub is_deleted: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct UserRef {
    pub id: i64,
    pub username: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobCard {
    pub id: i64,
    pub job_no: String,
    pub date: String,
    pub customer: Option<String>,
    pub cont_no: Option<String>,
    pub lc_c_no: Option<String>,
    pub ogc_no: Option<String>,
    pub part_name: Option<String>,
    pub po_no: Option<String>,
    pub bill_no: Option<String>,
    pub dwg_no: Option<String>,
    pub qty: Option<i64>,
    pub setting_start_time: Option<String>,
    pub setting_end_time: Option<String>,
    pub setting_total_time: Option<String>,
    pub job_start_time: Option<String>,
    pub job_end_time: Option<String>,
    pub job_total_time: Option<String>,
    pub mc_hrs_start: Option<String>,
    pub mc_hrs_end: Option<String>,
    pub mc_total_time: Option<String>,
    pub pl: Option<String>,
    pub thickness: Option<String>,
    pub taper: Option<String>,
    pub operator: Option<String>,
    pub remark: Option<String>,
    pub prog_no: Option<String>,
    pub amount: String,
    pub extra_fields: serde_json::Value,
    pub account_id: i64,
    pub user_id: i64,
    pub is_deleted: bool,
    pub created_at: String,
    pub updated_at: String,
    pub account: Option<AccountRef>,
    pub user: Option<UserRef>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobCardInput {
    pub date: Option<String>,
    pub customer: Option<String>,
    pub cont_no: Option<String>,
    pub lc_c_no: Option<String>,
    pub ogc_no: Option<String>,
    pub part_name: Option<String>,
    pub po_no: Option<String>,
    pub bill_no: Option<String>,
    pub dwg_no: Option<String>,
    pub qty: Option<serde_json::Value>,
    pub setting_start_time: Option<String>,
    pub setting_end_time: Option<String>,
    pub setting_total_time: Option<String>,
    pub job_start_time: Option<String>,
    pub job_end_time: Option<String>,
    pub job_total_time: Option<String>,
    pub mc_hrs_start: Option<String>,
    pub mc_hrs_end: Option<String>,
    pub mc_total_time: Option<String>,
    pub pl: Option<String>,
    pub thickness: Option<String>,
    pub taper: Option<String>,
    pub operator: Option<String>,
    pub remark: Option<String>,
    pub prog_no: Option<String>,
    pub amount: Option<String>,
    pub extra_fields: Option<serde_json::Value>,
    pub account_id: i64,
}

const SELECT_JOBCARD_SQL: &str = "
    SELECT
        jc.id, jc.job_no, jc.date, jc.customer, jc.cont_no, jc.lc_c_no, jc.ogc_no,
        jc.part_name, jc.po_no, jc.bill_no, jc.dwg_no, jc.qty,
        jc.setting_start_time, jc.setting_end_time, jc.setting_total_time,
        jc.job_start_time, jc.job_end_time, jc.job_total_time,
        jc.mc_hrs_start, jc.mc_hrs_end, jc.mc_total_time,
        jc.pl, jc.thickness, jc.taper, jc.operator, jc.remark, jc.prog_no,
        jc.amount, jc.extra_fields, jc.account_id, jc.user_id,
        jc.is_deleted, jc.created_at, jc.updated_at,
        a.id AS aid, a.acct_name, a.address AS aaddr, a.city AS acity,
        a.pin AS apin, a.fax AS afx, a.telex AS atelex,
        a.contact_person AS acontact, a.is_deleted AS adel,
        a.created_at AS acat, a.updated_at AS auat,
        u.id AS uid, u.username AS uname
    FROM job_cards jc
    LEFT JOIN accounts a ON jc.account_id = a.id AND a.is_deleted = 0
    LEFT JOIN users u ON jc.user_id = u.id
";

fn map_jobcard_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<JobCard> {
    let ef_str: Option<String> = row.get("extra_fields")?;
    let extra_fields: serde_json::Value = ef_str
        .as_deref()
        .and_then(|s| serde_json::from_str(s).ok())
        .unwrap_or_else(|| serde_json::Value::Object(Default::default()));

    let aid: Option<i64> = row.get("aid")?;
    let account = aid.map(|id| AccountRef {
        id,
        acct_name: row.get("acct_name").unwrap_or_default(),
        address: row.get("aaddr").unwrap_or(None),
        city: row.get("acity").unwrap_or(None),
        pin: row.get("apin").unwrap_or(None),
        fax: row.get("afx").unwrap_or(None),
        telex: row.get("atelex").unwrap_or(None),
        contact_person: row.get("acontact").unwrap_or(None),
        is_deleted: row.get::<_, i32>("adel").unwrap_or(0) != 0,
        created_at: row.get("acat").unwrap_or_default(),
        updated_at: row.get("auat").unwrap_or_default(),
    });

    let uid: Option<i64> = row.get("uid")?;
    let user = uid.map(|id| UserRef {
        id,
        username: row.get("uname").unwrap_or_default(),
    });

    Ok(JobCard {
        id: row.get("id")?,
        job_no: row.get("job_no")?,
        date: row.get("date")?,
        customer: row.get("customer")?,
        cont_no: row.get("cont_no")?,
        lc_c_no: row.get("lc_c_no")?,
        ogc_no: row.get("ogc_no")?,
        part_name: row.get("part_name")?,
        po_no: row.get("po_no")?,
        bill_no: row.get("bill_no")?,
        dwg_no: row.get("dwg_no")?,
        qty: row.get("qty")?,
        setting_start_time: row.get("setting_start_time")?,
        setting_end_time: row.get("setting_end_time")?,
        setting_total_time: row.get("setting_total_time")?,
        job_start_time: row.get("job_start_time")?,
        job_end_time: row.get("job_end_time")?,
        job_total_time: row.get("job_total_time")?,
        mc_hrs_start: row.get("mc_hrs_start")?,
        mc_hrs_end: row.get("mc_hrs_end")?,
        mc_total_time: row.get("mc_total_time")?,
        pl: row.get("pl")?,
        thickness: row.get("thickness")?,
        taper: row.get("taper")?,
        operator: row.get("operator")?,
        remark: row.get("remark")?,
        prog_no: row.get("prog_no")?,
        amount: row.get("amount")?,
        extra_fields,
        account_id: row.get("account_id")?,
        user_id: row.get("user_id")?,
        is_deleted: row.get::<_, i32>("is_deleted")? != 0,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        account,
        user,
    })
}

fn generate_job_no(conn: &rusqlite::Connection, acct_name: &str, account_id: i64) -> Result<String> {
    let prefix: String = acct_name
        .chars()
        .filter(|c| c.is_alphabetic())
        .take(3)
        .collect::<String>()
        .to_uppercase();
    let prefix = if prefix.len() < 3 {
        format!("{:X<3}", prefix)
    } else {
        prefix
    };

    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM job_cards WHERE account_id = ?1",
        rusqlite::params![account_id],
        |row| row.get(0),
    )?;

    Ok(format!("{}/{:04}", prefix, count + 1))
}

#[tauri::command]
pub fn jobcards_list(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
) -> Result<Vec<JobCard>> {
    let sess = session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;
    let conn = db.0.lock().unwrap();
    let sql = format!(
        "{} WHERE jc.is_deleted = 0 AND jc.user_id = ?1 ORDER BY jc.created_at DESC",
        SELECT_JOBCARD_SQL
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt
        .query_map(rusqlite::params![sess.id], map_jobcard_row)?
        .collect::<rusqlite::Result<Vec<JobCard>>>()?;
    Ok(rows)
}

#[tauri::command]
pub fn jobcards_get(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    id: i64,
) -> Result<Option<JobCard>> {
    let sess = session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;
    let conn = db.0.lock().unwrap();
    let sql = format!(
        "{} WHERE jc.id = ?1 AND jc.is_deleted = 0 AND jc.user_id = ?2",
        SELECT_JOBCARD_SQL
    );
    let result = conn
        .query_row(&sql, rusqlite::params![id, sess.id], map_jobcard_row)
        .optional()?;
    Ok(result)
}

#[tauri::command]
pub fn jobcards_create(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    data: JobCardInput,
) -> Result<JobCard> {
    let sess = session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;

    let conn = db.0.lock().unwrap();

    let (account_id, acct_name): (i64, String) = conn
        .query_row(
            "SELECT id, acct_name FROM accounts WHERE id = ?1 AND user_id = ?2 AND is_deleted = 0",
            rusqlite::params![data.account_id, sess.id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()?
        .ok_or_else(|| AppError("Account not found or inactive".to_string()))?;

    let job_no = generate_job_no(&conn, &acct_name, account_id)?;
    let date = data.date.unwrap_or_else(|| chrono::Utc::now().to_rfc3339());
    let qty = data.qty.as_ref().and_then(|v| v.as_i64());
    let extra_fields = data
        .extra_fields
        .map(|v| serde_json::to_string(&v).unwrap_or_default());
    let amount = data.amount.unwrap_or_else(|| "0.00".to_string());

    conn.execute(
        "INSERT INTO job_cards (
            job_no, date, customer, cont_no, lc_c_no, ogc_no, part_name, po_no,
            bill_no, dwg_no, qty, setting_start_time, setting_end_time, setting_total_time,
            job_start_time, job_end_time, job_total_time, mc_hrs_start, mc_hrs_end,
            mc_total_time, pl, thickness, taper, operator, remark, prog_no, amount,
            extra_fields, account_id, user_id
        ) VALUES (
            ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,
            ?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25,?26,?27,?28,?29,?30
        )",
        rusqlite::params![
            job_no, date, data.customer, data.cont_no, data.lc_c_no, data.ogc_no,
            data.part_name, data.po_no, data.bill_no, data.dwg_no, qty,
            data.setting_start_time, data.setting_end_time, data.setting_total_time,
            data.job_start_time, data.job_end_time, data.job_total_time,
            data.mc_hrs_start, data.mc_hrs_end, data.mc_total_time,
            data.pl, data.thickness, data.taper, data.operator, data.remark, data.prog_no,
            amount, extra_fields, account_id, sess.id
        ],
    )?;

    let new_id = conn.last_insert_rowid();
    let sql = format!(
        "{} WHERE jc.id = ?1 AND jc.is_deleted = 0",
        SELECT_JOBCARD_SQL
    );
    let card = conn.query_row(&sql, rusqlite::params![new_id], map_jobcard_row)?;
    Ok(card)
}

#[tauri::command]
pub fn jobcards_update(
    db: State<'_, DbState>,
    session: State<'_, SessionState>,
    id: i64,
    data: JobCardInput,
) -> Result<JobCard> {
    let sess = session
        .0
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| AppError("Not authenticated".to_string()))?;

    let conn = db.0.lock().unwrap();

    let owner: Option<i64> = conn
        .query_row(
            "SELECT user_id FROM job_cards WHERE id = ?1 AND is_deleted = 0",
            rusqlite::params![id],
            |row| row.get(0),
        )
        .optional()?;

    if owner != Some(sess.id) {
        return Err(AppError("Job card not found or permission denied".to_string()));
    }

    let _: i64 = conn
        .query_row(
            "SELECT id FROM accounts WHERE id = ?1 AND user_id = ?2 AND is_deleted = 0",
            rusqlite::params![data.account_id, sess.id],
            |row| row.get(0),
        )
        .optional()?
        .ok_or_else(|| AppError("Account not found or inactive".to_string()))?;

    let qty = data.qty.as_ref().and_then(|v| v.as_i64());
    let extra_fields = data
        .extra_fields
        .map(|v| serde_json::to_string(&v).unwrap_or_default());
    let amount = data.amount.unwrap_or_else(|| "0.00".to_string());

    conn.execute(
        "UPDATE job_cards SET
            date=COALESCE(?1, date), customer=?2, cont_no=?3, lc_c_no=?4, ogc_no=?5,
            part_name=?6, po_no=?7, bill_no=?8, dwg_no=?9, qty=?10,
            setting_start_time=?11, setting_end_time=?12, setting_total_time=?13,
            job_start_time=?14, job_end_time=?15, job_total_time=?16,
            mc_hrs_start=?17, mc_hrs_end=?18, mc_total_time=?19,
            pl=?20, thickness=?21, taper=?22, operator=?23, remark=?24,
            prog_no=?25, amount=?26, extra_fields=?27, account_id=?28,
            updated_at=datetime('now')
         WHERE id=?29 AND user_id=?30",
        rusqlite::params![
            data.date, data.customer, data.cont_no, data.lc_c_no, data.ogc_no,
            data.part_name, data.po_no, data.bill_no, data.dwg_no, qty,
            data.setting_start_time, data.setting_end_time, data.setting_total_time,
            data.job_start_time, data.job_end_time, data.job_total_time,
            data.mc_hrs_start, data.mc_hrs_end, data.mc_total_time,
            data.pl, data.thickness, data.taper, data.operator, data.remark, data.prog_no,
            amount, extra_fields, data.account_id,
            id, sess.id
        ],
    )?;

    let sql = format!(
        "{} WHERE jc.id = ?1 AND jc.is_deleted = 0",
        SELECT_JOBCARD_SQL
    );
    let card = conn.query_row(&sql, rusqlite::params![id], map_jobcard_row)?;
    Ok(card)
}

#[tauri::command]
pub fn jobcards_delete(
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
            "SELECT user_id FROM job_cards WHERE id = ?1 AND is_deleted = 0",
            rusqlite::params![id],
            |row| row.get(0),
        )
        .optional()?;

    if owner != Some(sess.id) {
        return Err(AppError("Job card not found or permission denied".to_string()));
    }

    conn.execute(
        "UPDATE job_cards SET is_deleted=1, updated_at=datetime('now') WHERE id=?1 AND user_id=?2",
        rusqlite::params![id, sess.id],
    )?;
    Ok(serde_json::json!({ "success": true }))
}
