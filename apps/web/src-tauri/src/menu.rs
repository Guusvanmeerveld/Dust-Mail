use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

pub fn create_menu() -> Menu {
    // Help menu
    let repository = CustomMenuItem::new("repository", "Repository");
    let donate = CustomMenuItem::new("donate", "Donate");
    let report_issue = CustomMenuItem::new("report_issue", "Report Issue");
    let license = CustomMenuItem::new("license", "License");
    let about = CustomMenuItem::new("about", "About");

    let help_submenu = Submenu::new(
        "Help",
        Menu::new()
            // .add_item(MenuItem::About((), ()))
            .add_item(repository)
            .add_native_item(MenuItem::Separator)
            .add_item(donate)
            .add_item(report_issue)
            .add_item(license)
            .add_native_item(MenuItem::Separator)
            .add_item(about),
    );

    Menu::os_default("Dust-Mail").add_submenu(help_submenu)
}
