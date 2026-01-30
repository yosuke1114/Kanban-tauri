// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use tauri::api::path::app_data_dir;

#[tauri::command]
fn save_board_data(data: String, handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_data_dir(&handle.config())
        .ok_or_else(|| "Failed to get app data directory".to_string())?;

    // アプリケーションデータディレクトリを作成
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    // ファイルパス
    let file_path = app_dir.join("kanban_board.json");

    // データを保存
    fs::write(&file_path, data).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn load_board_data(handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_data_dir(&handle.config())
        .ok_or_else(|| "Failed to get app data directory".to_string())?;

    let file_path = app_dir.join("kanban_board.json");

    // ファイルが存在しない場合は空のJSONを返す
    if !file_path.exists() {
        return Ok("{}".to_string());
    }

    // データを読み込み
    fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_data_path(handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_data_dir(&handle.config())
        .ok_or_else(|| "Failed to get app data directory".to_string())?;

    Ok(app_dir.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_board_data,
            load_board_data,
            get_data_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
