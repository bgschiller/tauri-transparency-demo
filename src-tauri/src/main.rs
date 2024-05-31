// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// The web code will tell us when the mouse is positioned over an element that should
// be clickable. At that point, it will call this function to tell us to stop ignoring
// mouse events.
#[tauri::command]
fn set_ignore_mouse_events(app_handle: tauri::AppHandle, ignore: bool, forward: bool) {
    let main_window = app_handle.get_webview_window("main").unwrap();
    let _ = main_window.with_webview(move |webview| {
        #[cfg(target_os = "macos")]
        unsafe {
            let () = msg_send![webview.ns_window(), setIgnoresMouseEvents:ignore];
            let () = msg_send![webview.ns_window(), setAcceptsMouseMovedEvents:forward];
        }
    });
    return ();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, set_ignore_mouse_events])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
