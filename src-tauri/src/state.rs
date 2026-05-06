use std::sync::Mutex;
use serde::{Deserialize, Serialize};

pub struct DbState(pub Mutex<rusqlite::Connection>);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSession {
    pub authenticated: bool,
}

pub struct SessionState(pub Mutex<Option<UserSession>>);
