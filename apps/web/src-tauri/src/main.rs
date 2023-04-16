#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod hash;
mod keyring;
mod sessions;

mod identifier;
mod menu;
mod parse;
mod tray;
mod types;

use sessions::Sessions;
use tauri::{Manager, SystemTrayEvent};

#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}

fn main() {
    let github_page = "https://github.com/Guusvanmeerveld/Dust-Mail";

    let menu = menu::create_menu();
    let tray = tray::create_tray();

    tauri::Builder::default()
        .menu(menu)
        .system_tray(tray)
        .manage(Sessions::new())
        .on_menu_event(move |event| match event.menu_item_id() {
            "repository" => {
                open::that(github_page).unwrap();
            }
            "donate" => {
                open::that("https://ko-fi.com/Guusvanmeerveld").unwrap();
            }
            "report_issue" => {
                open::that([github_page, "issues"].join("/")).unwrap();
            }
            "license" => {
                open::that([github_page, "blob/main/LICENSE"].join("/")).unwrap();
            }
            "about" => {
                event
                    .window()
                    .emit(
                        "show_about",
                        Payload {
                            message: "Show about".into(),
                        },
                    )
                    .unwrap();
            }
            _ => {}
        })
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "hide" => {
                    let window = app.get_window("main").unwrap();

                    window.hide().unwrap();
                }
                "show" => {
                    let window = app.get_window("main").unwrap();

                    window.show().unwrap();
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            commands::detect_config,
            commands::login,
            commands::logout,
            commands::get,
            commands::messages,
            commands::get_message,
            commands::list
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
