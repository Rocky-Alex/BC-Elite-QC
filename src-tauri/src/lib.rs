use std::process::Command;
use std::path::{Path, PathBuf};
use std::fs;

// Helper function to resolve tool paths dynamically
fn resolve_tool_path(file_name: &str, folder_name: &str) -> PathBuf {
    // 1. Check in same folder as current executable
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let path = exe_dir.join(file_name);
            if path.exists() {
                return path;
            }
            // Check parent of exe_dir directly (flat production layout where tools are in {app})
            let path = exe_dir.join("..").join(file_name);
            if path.exists() {
                return path;
            }
            // Check parent of exe_dir (production Inno Setup installation layout)
            let path = exe_dir.join("..").join(folder_name).join(file_name);
            if path.exists() {
                return path;
            }
            // Check dev path (e.g., current_exe is in src-tauri/target/debug/ or similar)
            // Workspace root is exe_dir/../../..
            if let Some(parent1) = exe_dir.parent() {
                if let Some(parent2) = parent1.parent() {
                    if let Some(parent3) = parent2.parent() {
                        let path = parent3.join(file_name);
                        if path.exists() {
                            return path;
                        }
                    }
                }
            }
        }
    }

    // 2. Check in current working directory
    if let Ok(cwd) = std::env::current_dir() {
        let path = cwd.join(file_name);
        if path.exists() {
            return path;
        }
        let path = cwd.join(folder_name).join(file_name);
        if path.exists() {
            return path;
        }
    }

    // Default fallback
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            return exe_dir.join("..").join(folder_name).join(file_name);
        }
    }
    PathBuf::from(file_name)
}

// 1. WMI/PowerShell system specs querying
#[tauri::command]
fn get_system_spec(command: String) -> Result<String, String> {
    if command.len() > 1000 || command.contains('\n') {
        let temp_dir = std::env::temp_dir();
        let temp_file_path = temp_dir.join(format!("qc_script_{}.ps1", std::process::id()));
        
        if let Err(e) = fs::write(&temp_file_path, &command) {
            return Err(format!("Failed to write temp script file: {}", e));
        }
        
        let output = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-ExecutionPolicy")
            .arg("Bypass")
            .arg("-File")
            .arg(&temp_file_path)
            .output();
            
        let _ = fs::remove_file(&temp_file_path);
        
        match output {
            Ok(out) => {
                if out.status.success() {
                    let stdout = String::from_utf8_lossy(&out.stdout).to_string();
                    Ok(stdout.trim().to_string())
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                    Err(stderr.trim().to_string())
                }
            }
            Err(err) => Err(err.to_string()),
        }
    } else {
        let output = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg(&command)
            .output();
            
        match output {
            Ok(out) => {
                if out.status.success() {
                    let stdout = String::from_utf8_lossy(&out.stdout).to_string();
                    Ok(stdout.trim().to_string())
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                    Err(stderr.trim().to_string())
                }
            }
            Err(err) => Err(err.to_string()),
        }
    }
}

// 2. Check if a diagnostic tool exists
#[tauri::command]
fn check_tool_exists(file_name: String, folder_name: String) -> bool {
    let path = resolve_tool_path(&file_name, &folder_name);
    path.exists()
}

// 3. Launch a diagnostic tool
#[tauri::command]
fn launch_tool(file_name: String, folder_name: String) -> Result<String, String> {
    let path = resolve_tool_path(&file_name, &folder_name);
    if !path.exists() {
        return Err(format!("File not found: {:?}", path));
    }

    if file_name.ends_with(".mp4") {
        let status = Command::new("cmd")
            .arg("/c")
            .arg("start")
            .arg("")
            .arg(&path)
            .status();
        match status {
            Ok(stat) if stat.success() => Ok(format!("Opened media file: {}", file_name)),
            Ok(stat) => Err(format!("Failed to open media file (status: {:?})", stat)),
            Err(e) => Err(e.to_string()),
        }
    } else {
        let status = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg(format!(
                "Start-Process -FilePath '{}' -Verb RunAs -WorkingDirectory '{}'",
                path.to_str().unwrap_or(""),
                path.parent().unwrap_or_else(|| Path::new(".")).to_str().unwrap_or("")
            ))
            .status();
        match status {
            Ok(stat) if stat.success() => Ok(format!("Executed {} with elevation", file_name)),
            Ok(stat) => Err(format!("Failed to start elevated process (exit status: {:?})", stat)),
            Err(e) => Err(e.to_string()),
        }
    }
}

// 4. Launch system utility (camera, sound dialog, dxdiag, etc.)
#[tauri::command]
fn launch_system_tool(command: String) -> Result<(), String> {
    let clean_cmd = command.strip_prefix("start ").unwrap_or(&command).trim();
    let status = Command::new("cmd")
        .arg("/c")
        .arg(format!("start {}", clean_cmd))
        .status();
    
    match status {
        Ok(stat) if stat.success() => Ok(()),
        Ok(stat) => Err(format!("Failed to execute system tool (exit code: {:?})", stat.code())),
        Err(e) => Err(e.to_string()),
    }
}

// 5. Generate powercfg battery report
#[tauri::command]
fn run_battery_diagnostics() -> Result<String, String> {
    let temp_dir = std::env::temp_dir();
    let xml_path = temp_dir.join("battery_report.xml");
    
    let output = Command::new("powercfg")
        .arg("/batteryreport")
        .arg("/xml")
        .arg("/output")
        .arg(&xml_path)
        .output();
    
    match output {
        Ok(out) => {
            if out.status.success() && xml_path.exists() {
                Ok(xml_path.to_string_lossy().to_string())
            } else {
                let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                Err(format!("powercfg failed: {}", stderr))
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

// 6. Save records table to Desktop as CSV
#[tauri::command]
fn save_table_file(data: String, file_name: String) -> Result<String, String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    let desktop_path = Path::new(&home).join("Desktop");
    let file_path = desktop_path.join(file_name);
    
    match fs::write(&file_path, data) {
        Ok(_) => Ok(file_path.to_string_lossy().to_string()),
        Err(e) => Err(e.to_string()),
    }
}

// 7. Read text file contents
#[tauri::command]
fn read_file_content(file_path: String) -> Result<String, String> {
    match fs::read_to_string(file_path) {
        Ok(content) => Ok(content),
        Err(e) => Err(e.to_string()),
    }
}

// 8. Custom frameless window actions (minimize, maximize, close)
#[tauri::command]
fn window_control(action: String, window: tauri::Window) -> Result<(), String> {
    match action.as_str() {
        "minimize" => {
            let _ = window.minimize();
        }
        "maximize" => {
            if let Ok(maximized) = window.is_maximized() {
                if maximized {
                    let _ = window.unmaximize();
                } else {
                    let _ = window.maximize();
                }
            }
        }
        "close" => {
            let _ = window.close();
        }
        _ => return Err("Invalid window action".to_string()),
    }
    Ok(())
}

#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

// 9. HTTP POST proxy — sends JSON payload to external API (bypasses WebView fetch restrictions)
#[tauri::command]
async fn http_post(url: String, body: String, token: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", token))
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = response.status().as_u16();
    let text = response.text().await.map_err(|e| e.to_string())?;

    if status >= 200 && status < 300 {
        Ok(text)
    } else {
        Err(format!("HTTP {}: {}", status, text))
    }
}

// 10. HTTP GET proxy — retrieves data from external API (bypasses WebView fetch restrictions)
#[tauri::command]
async fn http_get(url: String, token: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = response.status().as_u16();
    let text = response.text().await.map_err(|e| e.to_string())?;

    if status >= 200 && status < 300 {
        Ok(text)
    } else {
        Err(format!("HTTP {}: {}", status, text))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_system_spec,
            check_tool_exists,
            launch_tool,
            launch_system_tool,
            run_battery_diagnostics,
            save_table_file,
            read_file_content,
            window_control,
            get_app_version,
            http_post,
            http_get
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
