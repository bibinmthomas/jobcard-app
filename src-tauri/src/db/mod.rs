use rusqlite::Connection;
use crate::error::Result;

pub fn initialize_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys=ON;

        CREATE TABLE IF NOT EXISTS app_auth (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            password_hash TEXT NOT NULL,
            is_default_password INTEGER NOT NULL DEFAULT 1,
            password_set_at TEXT,
            password_expires_at TEXT
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
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (account_id) REFERENCES accounts(id)
        );

        CREATE TABLE IF NOT EXISTS form_fields (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
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

fn table_exists(conn: &Connection, table: &str) -> Result<bool> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?1",
        rusqlite::params![table],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

fn column_exists(conn: &Connection, table: &str, column: &str) -> Result<bool> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table))?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(1))?;
    let found = rows.flatten().any(|col| col == column);
    Ok(found)
}

fn migration_applied(conn: &Connection, version: i64) -> Result<bool> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM schema_migrations WHERE version = ?1",
        rusqlite::params![version],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

/// Applies schema migrations for existing installs.
/// New installs get the correct schema from initialize_schema and skip these automatically.
pub fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    ")?;

    // If M003 is already applied, all migrations are done
    if migration_applied(conn, 3)? {
        return Ok(());
    }

    let users_table_exists = table_exists(conn, "users")?;

    if !users_table_exists {
        // Fresh install — schema is already correct, mark all versions applied
        conn.execute("INSERT OR IGNORE INTO schema_migrations (version) VALUES (1)", [])?;
        conn.execute("INSERT OR IGNORE INTO schema_migrations (version) VALUES (2)", [])?;
        conn.execute("INSERT OR IGNORE INTO schema_migrations (version) VALUES (3)", [])?;
        return Ok(());
    }

    // Existing install: run M001 → M002 (mark as superseded) → M003

    // M001: ensure user_id columns exist before M003 reads/migrates data
    if !column_exists(conn, "accounts", "user_id")? {
        conn.execute_batch(
            "ALTER TABLE accounts ADD COLUMN user_id INTEGER REFERENCES users(id);"
        )?;
        conn.execute_batch(
            "CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);"
        )?;
    }
    if !column_exists(conn, "form_fields", "user_id")? {
        conn.execute_batch(
            "ALTER TABLE form_fields ADD COLUMN user_id INTEGER REFERENCES users(id);"
        )?;
        conn.execute_batch(
            "CREATE INDEX IF NOT EXISTS idx_form_fields_user_id ON form_fields(user_id);"
        )?;
    }
    conn.execute("INSERT OR IGNORE INTO schema_migrations (version) VALUES (1)", [])?;
    // M002 is superseded by M003 (both recreate tables; M003 is the authoritative version)
    conn.execute("INSERT OR IGNORE INTO schema_migrations (version) VALUES (2)", [])?;

    // M003: strip user_id from all data tables, drop users, create app_auth
    conn.execute("PRAGMA foreign_keys=OFF", [])?;
    conn.execute_batch("
        BEGIN;

        CREATE TABLE accounts_new (
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
        INSERT INTO accounts_new
            SELECT id, acct_name, address, city, pin, fax, telex, contact_person,
                   is_deleted, created_at, updated_at
            FROM accounts;
        DROP TABLE accounts;
        ALTER TABLE accounts_new RENAME TO accounts;

        CREATE TABLE job_cards_new (
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
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (account_id) REFERENCES accounts(id)
        );
        INSERT INTO job_cards_new
            SELECT id, job_no, date, customer, cont_no, lc_c_no, ogc_no,
                   part_name, po_no, bill_no, dwg_no, qty,
                   setting_start_time, setting_end_time, setting_total_time,
                   job_start_time, job_end_time, job_total_time,
                   mc_hrs_start, mc_hrs_end, mc_total_time,
                   pl, thickness, taper, operator, remark, prog_no,
                   amount, extra_fields, account_id, is_deleted, created_at, updated_at
            FROM job_cards;
        DROP TABLE job_cards;
        ALTER TABLE job_cards_new RENAME TO job_cards;

        CREATE TABLE form_fields_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            label TEXT NOT NULL,
            field_type TEXT NOT NULL DEFAULT 'string',
            options TEXT,
            required INTEGER NOT NULL DEFAULT 0,
            display_order INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO form_fields_new
            SELECT id, name, label, field_type, options, required, display_order,
                   is_deleted, created_at, updated_at
            FROM form_fields;
        DROP TABLE form_fields;
        ALTER TABLE form_fields_new RENAME TO form_fields;

        DROP INDEX IF EXISTS idx_job_cards_user_id;
        DROP INDEX IF EXISTS idx_accounts_user_id;
        DROP INDEX IF EXISTS idx_form_fields_user_id;
        CREATE INDEX IF NOT EXISTS idx_job_cards_account_id ON job_cards(account_id);
        CREATE INDEX IF NOT EXISTS idx_job_cards_is_deleted ON job_cards(is_deleted);
        CREATE INDEX IF NOT EXISTS idx_accounts_is_deleted ON accounts(is_deleted);
        CREATE INDEX IF NOT EXISTS idx_form_fields_is_deleted ON form_fields(is_deleted);

        DROP TABLE IF EXISTS users;

        COMMIT;
    ")?;
    conn.execute("PRAGMA foreign_keys=ON", [])?;
    conn.execute("INSERT OR IGNORE INTO schema_migrations (version) VALUES (3)", [])?;

    Ok(())
}

/// Seeds the default password on first launch if app_auth is empty.
/// Default password: "beees" + today's date in DDMMYYYY format.
pub fn seed_default_password(conn: &Connection) -> Result<()> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM app_auth",
        [],
        |row| row.get(0),
    )?;

    if count == 0 {
        let date_str = chrono::Local::now().format("%d%m%Y").to_string();
        let default_pw = format!("beees{}", date_str);
        let hash = bcrypt::hash(&default_pw, 10)?;
        conn.execute(
            "INSERT INTO app_auth (id, password_hash, is_default_password) VALUES (1, ?1, 1)",
            rusqlite::params![hash],
        )?;
        log::info!("[auth:seed] Default password seeded for first launch");
    }

    Ok(())
}
