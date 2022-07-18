#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::Manager;

use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use tauri::{SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

fn main() {
  // File menu
  let file_submenu = Submenu::new(
    "File",
    Menu::new()
      .add_native_item(MenuItem::Hide)
      .add_native_item(MenuItem::CloseWindow)
      .add_native_item(MenuItem::Separator)
      .add_native_item(MenuItem::Quit),
  );

  let edit_submenu = Submenu::new(
    "Edit",
    Menu::new()
      .add_native_item(MenuItem::Undo)
      .add_native_item(MenuItem::Redo)
      .add_native_item(MenuItem::Separator)
      .add_native_item(MenuItem::Cut)
      .add_native_item(MenuItem::Copy)
      .add_native_item(MenuItem::Paste),
  );

  // View menu
  let view_submenu = Submenu::new(
    "View",
    Menu::new()
      .add_native_item(MenuItem::EnterFullScreen)
      .add_native_item(MenuItem::Zoom),
  );

  // Help menu
  let repository = CustomMenuItem::new("repository".to_string(), "Repository");
  let donate = CustomMenuItem::new("donate".to_string(), "Donate");
  let report_issue = CustomMenuItem::new("report_issue".to_string(), "Report Issue");
  let license = CustomMenuItem::new("license".to_string(), "License");
  let about = CustomMenuItem::new("about".to_string(), "About");

  let help_submenu = Submenu::new(
    "Help",
    Menu::new()
      .add_item(repository)
      .add_native_item(MenuItem::Separator)
      .add_item(donate)
      .add_item(report_issue)
      .add_item(license)
      .add_native_item(MenuItem::Separator)
      .add_item(about),
  );

  let menu = Menu::new()
    .add_submenu(file_submenu)
    .add_submenu(edit_submenu)
    .add_submenu(view_submenu)
    .add_submenu(help_submenu);

  let show = CustomMenuItem::new("show".to_string(), "Show");
  let hide = CustomMenuItem::new("hide".to_string(), "Hide");
  let quit = CustomMenuItem::new("quit".to_string(), "Quit");

  let tray_menu = SystemTrayMenu::new()
    .add_item(show)
    .add_item(hide)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit);

  let tray = SystemTray::new().with_menu(tray_menu);

  let github_page = "https://github.com/Guusvanmeerveld/Dust-Mail";

  tauri::Builder::default()
    // .invoke_handler(tauri::generate_handler![oauth_login_token])
    .menu(menu)
    .system_tray(tray)
    .on_menu_event(move |event| match event.menu_item_id() {
      "repository" => {
        open::that(github_page).unwrap();
      }
      "donate" => {
        open::that("https://ko-fi.com/Guusvanmeerveld").unwrap();
      }
      "report_issue" => {
        open::that([github_page, "/issues"].join("")).unwrap();
      }
      "license" => {
        open::that([github_page, "/blob/main/LICENSE"].join("")).unwrap();
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
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
