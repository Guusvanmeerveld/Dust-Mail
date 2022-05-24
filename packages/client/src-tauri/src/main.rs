#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::Manager;

use native_tls::TlsConnector;

use std::sync::{Arc, Mutex};

struct ImapClient<Mutex<Option<Client>>>;

#[tauri::command]
async fn close_splashscreen(window: tauri::Window) {
  if let Some(splashscreen) = window.get_window("splashscreen") {
    splashscreen.close().unwrap();
  }

  window.get_window("main").unwrap().show().unwrap();
}

#[tauri::command]
fn connect(
  server: String,
  port: u16,
  clientState: tauri::State<ImapClient>,
) -> Result<String, String> {
  let tls = TlsConnector::builder().build().unwrap();

  let client = imap::connect((server.clone(), port), &server, &tls);

  match client {
    Ok(_) => Ok(format!(
      "Connected to imap server at {} on port {}",
      server, port
    )),
    Err(error) => Err(format!("Error connecting to {}: {}", server, error)),
  }
}

#[tauri::command]
fn login(
  user: String,
  password: String,
  client: tauri::State<ImapClient>,
) -> Result<String, String> {
}

fn main() {
  tauri::Builder::default()
    .manage(ImapClient {})
    .invoke_handler(tauri::generate_handler![close_splashscreen, connect, login])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
