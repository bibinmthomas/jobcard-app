use rusqlite::Connection;
use crate::error::Result;

pub fn initialize_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys=ON;

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            acct_name TEXT NOT NULL,
            address TEXT,
            city TEXT,
            pin TEXT,
            fax TEXT,
            telex TEXT,
            contact_person TEXT,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(acct_name, city)
        );

        CREATE TABLE IF NOT EXISTS job_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_no TEXT NOT NULL,
            date TEXT NOT NULL DEFAULT (datetime('now')),
            customer TEXT,
            cont_no TEXT,
            lc_c_no TEXT,
            ogc_no TEXT,
            part_name TEXT,
            po_no TEXT,
            bill_no TEXT,
            dwg_no TEXT,
            qty INTEGER,
            setting_start_time TEXT,
            setting_end_time TEXT,
            setting_total_time TEXT,
            job_start_time TEXT,
            job_end_time TEXT,
            job_total_time TEXT,
            mc_hrs_start TEXT,
            mc_hrs_end TEXT,
            mc_total_time TEXT,
            pl TEXT,
            thickness TEXT,
            taper TEXT,
            operator TEXT,
            remark TEXT,
            prog_no TEXT,
            amount TEXT NOT NULL DEFAULT '0.00',
            extra_fields TEXT,
            account_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (account_id) REFERENCES accounts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS form_fields (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            label TEXT NOT NULL,
            field_type TEXT NOT NULL DEFAULT 'string',
            options TEXT,
            required INTEGER NOT NULL DEFAULT 0,
            display_order INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_job_cards_account_id ON job_cards(account_id);
        CREATE INDEX IF NOT EXISTS idx_job_cards_is_deleted ON job_cards(is_deleted);
        CREATE INDEX IF NOT EXISTS idx_accounts_is_deleted ON accounts(is_deleted);
        CREATE INDEX IF NOT EXISTS idx_form_fields_is_deleted ON form_fields(is_deleted);
    ")?;

    Ok(())
}
