use lazy_static::lazy_static;
use std::collections::HashSet;
use std::sync::Mutex;
use windows::Win32::Foundation::{BOOL, HWND, LPARAM, LRESULT, POINT, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::{PtInRect, ScreenToClient};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, EnumChildWindows, GetClassNameW, GetClientRect, PostMessageA,
    SetWindowsHookExA, UnhookWindowsHookEx, HHOOK, WH_MOUSE_LL, WM_MOUSEMOVE,
};

lazy_static! {
    static ref FORWARDING_WINDOWS: Mutex<HashSet<isize>> = Mutex::new(HashSet::new());
    static ref MOUSE_HOOK: Mutex<Option<HHOOK>> = Mutex::new(None);
}

pub fn set_forward_mouse_messages(window: tauri::webview::WebviewWindow, forward: bool) {
    let hwnd = window.hwnd().unwrap();
    let child = find_child_window(hwnd);
    if child.is_none() {
        println!("Failed to find child window");
        return;
    } else {
        let child_hwnd = child.unwrap();
        if forward {
            FORWARDING_WINDOWS.lock().unwrap().insert(child_hwnd.0);

            let mut hook = MOUSE_HOOK.lock().unwrap();
            if hook.is_none() {
                let result = unsafe { SetWindowsHookExA(WH_MOUSE_LL, Some(mouse_hook), None, 0) };
                if result.is_err() {
                    println!("Failed to hook mouse hook");
                    println!("Error code: {}", result.err().unwrap());
                    return;
                }
                hook.replace(result.unwrap());
            }
        } else {
            let mut forwarding_windows = FORWARDING_WINDOWS.lock().unwrap();
            forwarding_windows.remove(&child_hwnd.0);
            if forwarding_windows.is_empty() {
                unsafe {
                    let mut hook = MOUSE_HOOK.lock().unwrap();
                    if hook.is_some() {
                        let _ = UnhookWindowsHookEx(hook.take().unwrap());
                    }
                }
            }
        }
    }
}

fn make_lparam(lo: u16, hi: u16) -> u32 {
    (lo as u32) | ((hi as u32) << 16)
}

fn find_child_window(parent: HWND) -> Option<HWND> {
    let mut result = None;
    unsafe {
        let _ = EnumChildWindows(
            parent,
            Some(enum_windows),
            LPARAM(&mut result as *mut _ as isize),
        );
    }
    result
}

unsafe extern "system" fn enum_windows(hwnd: HWND, lparam: LPARAM) -> BOOL {
    let mut name: [u16; 256] = [0; 256];
    GetClassNameW(hwnd, &mut name);
    let path: String = name
        .iter()
        .map(|&v| (v & 0xFF) as u8)
        .take_while(|&c| c != 0)
        .map(|c| c as char)
        .collect();
    // This is the window that receives move messages normally.
    if path == "Chrome_RenderWidgetHostHWND" {
        let result: &mut Option<HWND> = std::mem::transmute(lparam.0);
        *result = Some(hwnd);
        return BOOL(0);
    }
    BOOL(1)
}

// This hook forwards mouse move messages to the child window.
// We check each window that has requested forwarding and see if the mouse is in the window.
// If it is, we forward the message to the window.
extern "system" fn mouse_hook(n_code: i32, w_param: WPARAM, l_param: LPARAM) -> LRESULT {
    if n_code < 0 {
        return unsafe { CallNextHookEx(None, n_code, w_param, l_param) };
    }

    if w_param == WPARAM(WM_MOUSEMOVE as usize) {
        let windows = FORWARDING_WINDOWS.lock().unwrap();
        for &hwnd in windows.iter() {
            let target = HWND(hwnd);
            let mut client_rect: RECT = RECT {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            };
            let _ = unsafe { GetClientRect(target, &mut client_rect) };

            let mut p: POINT;
            unsafe {
                p = *std::mem::transmute::<LPARAM, *mut POINT>(l_param);
                let _ = ScreenToClient(target, &mut p);
                let is_in_rect = PtInRect(&client_rect, p).into();
                if is_in_rect {
                    let w: WPARAM = WPARAM(0);
                    let l: LPARAM = LPARAM(make_lparam(p.x as u16, p.y as u16) as isize);
                    let _ = PostMessageA(target, WM_MOUSEMOVE, w, l);
                }
            }
        }
    }

    unsafe { CallNextHookEx(None, n_code, w_param, l_param) }
}
