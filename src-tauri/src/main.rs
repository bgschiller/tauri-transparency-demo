// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};
#[cfg(target_os = "windows")]
mod win_transparency;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// The web code will tell us when the mouse is positioned over an element that should
// be clickable. At that point, it will call this function to tell us to stop ignoring
// mouse events.
#[tauri::command]
fn set_ignore_mouse_events(window: tauri::webview::WebviewWindow, ignore: bool, forward: bool) {
    window
        .set_ignore_cursor_events(ignore)
        .expect("Error setting ignore cursor events");

    #[cfg(target_os = "windows")]
    {
        win_transparency::set_forward_mouse_messages(window, forward);
    }

    #[cfg(target_os = "macos")]
    {
        window
            .with_webview(move |webview| unsafe {
                let () = msg_send![webview.ns_window(), setAcceptsMouseMovedEvents:forward];
            })
            .expect("Error setting forward for mouseMovedEvents on webview");
    }
    ()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, set_ignore_mouse_events])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
