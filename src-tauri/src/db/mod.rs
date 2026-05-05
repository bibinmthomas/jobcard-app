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
            user_id INTEGER REFERENCES users(id),
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(acct_name, city, user_id)
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
            name TEXT NOT NULL,
            label TEXT NOT NULL,
            field_type TEXT NOT NULL DEFAULT 'string',
            options TEXT,
            required INTEGER NOT NULL DEFAULT 0,
            display_order INTEGER NOT NULL DEFAULT 0,
            user_id INTEGER REFERENCES users(id),
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(name, user_id)
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_job_cards_account_id ON job_cards(account_id);
        CREATE INDEX IF NOT EXISTS idx_job_cards_user_id ON job_cards(user_id);
        CREATE INDEX IF NOT EXISTS idx_job_cards_is_deleted ON job_cards(is_deleted);
        CREATE INDEX IF NOT EXISTS idx_accounts_is_deleted ON accounts(is_deleted);
        CREATE INDEX IF NOT EXISTS idx_form_fields_is_deleted ON form_fields(is_deleted);
    ")?;

    Ok(())
}

fn column_exists(conn: &Connection, table: &str, column: &str) -> Result<bool> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table))?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(1))?;
    let found = rows.flatten().any(|col| col == column);
    Ok(found)
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

    // M001: Add user_id columns to accounts and form_fields
    let accounts_missing_user_id = !column_exists(conn, "accounts", "user_id")?;

    if accounts_missing_user_id {
        conn.execute_batch(
            "ALTER TABLE accounts ADD COLUMN user_id INTEGER REFERENCES users(id);",
        )?;
    }
    if !column_exists(conn, "form_fields", "user_id")? {
        conn.execute_batch(
            "ALTER TABLE form_fields ADD COLUMN user_id INTEGER REFERENCES users(id);",
        )?;
    }
    conn.execute_batch("
        CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
        CREATE INDEX IF NOT EXISTS idx_form_fields_user_id ON form_fields(user_id);
    ")?;
    conn.execute("INSERT OR IGNORE INTO schema_migrations (version) VALUES (1)", [])?;

    // M002: Recreate accounts and form_fields with user-scoped UNIQUE constraints.
    // Only runs on existing installs where user_id was just added (accounts_missing_user_id).
    // New installs already have the correct schema from initialize_schema.
    let m002_applied: bool = conn.query_row(
        "SELECT COUNT(*) FROM schema_migrations WHERE version = 2",
        [],
        |row| row.get::<_, i64>(0),
    )? > 0;

    if !m002_applied && accounts_missing_user_id {
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
                user_id INTEGER REFERENCES users(id),
                is_deleted INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(acct_name, city, user_id)
            );
            INSERT INTO accounts_new
                SELECT id, acct_name, address, city, pin, fax, telex, contact_person,
                       user_id, is_deleted, created_at, updated_at
                FROM accounts;
            DROP TABLE accounts;
            ALTER TABLE accounts_new RENAME TO accounts;

            CREATE TABLE form_fields_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                label TEXT NOT NULL,
                field_type TEXT NOT NULL DEFAULT 'string',
                options TEXT,
                required INTEGER NOT NULL DEFAULT 0,
                display_order INTEGER NOT NULL DEFAULT 0,
                user_id INTEGER REFERENCES users(id),
                is_deleted INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(name, user_id)
            );
            INSERT INTO form_fields_new
                SELECT id, name, label, field_type, options, required, display_order,
                       user_id, is_deleted, created_at, updated_at
                FROM form_fields;
            DROP TABLE form_fields;
            ALTER TABLE form_fields_new RENAME TO form_fields;

            COMMIT;
        ")?;
        conn.execute("PRAGMA foreign_keys=ON", [])?;
    }
    conn.execute("INSERT OR IGNORE INTO schema_migrations (version) VALUES (2)", [])?;

    Ok(())
}
