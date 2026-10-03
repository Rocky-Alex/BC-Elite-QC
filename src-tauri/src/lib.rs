use std::process::Command;
use std::path::{Path, PathBuf};
use std::fs;
use sha2::{Sha256, Digest};

// Helper function to resolve tool paths dynamically across all layouts (flat root, Master Checker, Inno Setup, Dev)
fn resolve_tool_path(file_name: &str, folder_name: &str) -> PathBuf {
    let mut search_dirs = Vec::new();

    // 1. Current executable directory hierarchy
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            search_dirs.push(exe_dir.to_path_buf());
            if let Some(p1) = exe_dir.parent() {
                search_dirs.push(p1.to_path_buf());
                if let Some(p2) = p1.parent() {
                    search_dirs.push(p2.to_path_buf());
                    if let Some(p3) = p2.parent() {
                        search_dirs.push(p3.to_path_buf());
                    }
                }
            }
        }
    }

    // 2. Current working directory hierarchy
    if let Ok(cwd) = std::env::current_dir() {
        if !search_dirs.contains(&cwd) {
            search_dirs.push(cwd.clone());
        }
        if let Some(cwd_parent) = cwd.parent() {
            let cwd_parent_buf = cwd_parent.to_path_buf();
            if !search_dirs.contains(&cwd_parent_buf) {
                search_dirs.push(cwd_parent_buf);
            }
        }
    }

    // 3. Standard installation targets
    search_dirs.push(PathBuf::from(r"C:\BC Elite QC"));
    search_dirs.push(PathBuf::from(r"C:\BizzCoHub QC"));
    search_dirs.push(PathBuf::from(r"X:\BC Elite QC"));
    search_dirs.push(PathBuf::from(r"X:\BizzCoHub QC"));

    // Check each directory for folder_name/file_name and direct file_name
    for dir in &search_dirs {
        let p_folder = dir.join(folder_name).join(file_name);
        if p_folder.exists() {
            return p_folder;
        }
        let p_flat = dir.join(file_name);
        if p_flat.exists() {
            return p_flat;
        }
    }

    // Default fallback
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let direct = exe_dir.join(folder_name).join(file_name);
            if direct.exists() {
                return direct;
            }
            return exe_dir.join("..").join(folder_name).join(file_name);
        }
    }
    PathBuf::from(folder_name).join(file_name)
}

// Helper to locate powershell.exe reliably across standard Windows and Live OS (WinPE)
fn get_powershell_path() -> PathBuf {
    let mut candidates = Vec::new();

    // Check SystemRoot / windir environment variables
    if let Ok(sys_root) = std::env::var("SystemRoot").or_else(|_| std::env::var("windir")) {
        candidates.push(PathBuf::from(&sys_root).join(r"System32\WindowsPowerShell\v1.0\powershell.exe"));
        candidates.push(PathBuf::from(&sys_root).join(r"SysWOW64\WindowsPowerShell\v1.0\powershell.exe"));
    }

    // Check known drives (including WinPE default X: and C:)
    candidates.push(PathBuf::from(r"X:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"));
    candidates.push(PathBuf::from(r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"));
    candidates.push(PathBuf::from(r"D:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"));

    for candidate in candidates {
        if candidate.exists() {
            return candidate;
        }
    }

    // Fall back to PATH search
    PathBuf::from("powershell")
}

// 1. WMI/PowerShell system specs querying (executed in-memory via stdin to bypass AppControl/temp restrictions)
#[tauri::command]
fn get_system_spec(command: String) -> Result<String, String> {
    use std::io::Write;
    let ps_path = get_powershell_path();

    if command.len() > 1000 || command.contains('\n') {
        // Stream command directly via stdin without writing temporary files to %TEMP%
        let mut child = Command::new(&ps_path)
            .arg("-NoProfile")
            .arg("-ExecutionPolicy")
            .arg("Bypass")
            .arg("-Command")
            .arg("-")
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn PowerShell ({:?}): {}", ps_path, e))?;

        if let Some(mut stdin) = child.stdin.take() {
            let _ = stdin.write_all(command.as_bytes());
        }

        let output = child.wait_with_output().map_err(|e| format!("PowerShell execution error: {}", e))?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            Ok(stdout.trim().to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            Err(stderr.trim().to_string())
        }
    } else {
        let output = Command::new(&ps_path)
            .arg("-NoProfile")
            .arg("-ExecutionPolicy")
            .arg("Bypass")
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

    let parent_dir = path.parent().unwrap_or_else(|| Path::new("."));

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
        // First try launching directly (0ms latency, works on Live OS / SYSTEM user / Admin)
        match Command::new(&path).current_dir(parent_dir).spawn() {
            Ok(_) => Ok(format!("Executed {} directly", file_name)),
            Err(err) => {
                // If direct launch fails because elevation is required (ERROR_ELEVATION_REQUIRED = 740)
                // or access is denied, request elevation via PowerShell Start-Process -Verb RunAs
                let ps_path = get_powershell_path();
                let runas_status = Command::new(&ps_path)
                    .arg("-NoProfile")
                    .arg("-Command")
                    .arg(format!(
                        "Start-Process -FilePath '{}' -Verb RunAs -WorkingDirectory '{}'",
                        path.to_str().unwrap_or(""),
                        parent_dir.to_str().unwrap_or("")
                    ))
                    .status();

                match runas_status {
                    Ok(stat) if stat.success() => Ok(format!("Executed {} with elevation", file_name)),
                    _ => Err(format!("Failed to launch {}: {}", file_name, err)),
                }
            }
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

// 6. Save records table / spec text with a native Save As file dialog
#[tauri::command]
fn save_table_file(data: String, file_name: String) -> Result<String, String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    
    let onedrive_desktop = Path::new(&home).join("OneDrive").join("Desktop");
    let standard_desktop = Path::new(&home).join("Desktop");

    let default_dir = if onedrive_desktop.exists() && onedrive_desktop.is_dir() {
        onedrive_desktop
    } else {
        standard_desktop
    };

    let mut dialog = rfd::FileDialog::new()
        .set_directory(&default_dir)
        .set_file_name(&file_name);

    if file_name.ends_with(".txt") {
        dialog = dialog.add_filter("Text Document (*.txt)", &["txt"]);
    } else if file_name.ends_with(".csv") {
        dialog = dialog.add_filter("CSV Document (*.csv)", &["csv"]);
    } else if file_name.ends_with(".pdf") {
        dialog = dialog.add_filter("PDF Document (*.pdf)", &["pdf"]);
    } else if file_name.ends_with(".json") {
        dialog = dialog.add_filter("JSON Document (*.json)", &["json"]);
    }
    dialog = dialog.add_filter("All Files (*.*)", &["*"]);

    if let Some(file_path) = dialog.save_file() {
        match fs::write(&file_path, data) {
            Ok(_) => Ok(file_path.to_string_lossy().to_string()),
            Err(e) => Err(e.to_string()),
        }
    } else {
        Err("SAVE_CANCELLED".to_string())
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

// 8b. Set native OS fullscreen (covers taskbar completely)
#[tauri::command]
fn set_fullscreen(state: bool, window: tauri::Window) -> Result<(), String> {
    if state {
        let _ = window.set_decorations(true);
        let _ = window.set_always_on_top(false);
        let _ = window.set_focus();
    } else {
        let _ = window.set_always_on_top(false);
        let _ = window.set_decorations(false);
    }
    window.set_fullscreen(state).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

// Determines if application runs in Admin mode or Customer mode
#[tauri::command]
fn get_app_mode() -> String {
    // 1. Check CLI arguments
    for arg in std::env::args() {
        let lower = arg.to_lowercase();
        if lower == "--admin" || lower == "-admin" || lower == "--mode=admin" || lower == "-mode=admin" {
            return "admin".to_string();
        }
        if lower == "--customer" || lower == "-customer" || lower == "--mode=customer" || lower == "-mode=customer" {
            return "customer".to_string();
        }
    }

    // 2. Check app_mode.json in executable directory, parent directory, or working directory
    let mut candidate_paths = Vec::new();
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            candidate_paths.push(exe_dir.join("app_mode.json"));
            if let Some(parent) = exe_dir.parent() {
                candidate_paths.push(parent.join("app_mode.json"));
                if let Some(grandparent) = parent.parent() {
                    candidate_paths.push(grandparent.join("app_mode.json"));
                    if let Some(great_grandparent) = grandparent.parent() {
                        candidate_paths.push(great_grandparent.join("app_mode.json"));
                    }
                }
            }
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        candidate_paths.push(cwd.join("app_mode.json"));
    }

    for path in candidate_paths {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                let lower = content.to_lowercase();
                if lower.contains("\"mode\": \"admin\"") || lower.contains("\"mode\":\"admin\"") || lower.contains("\"admin\"") {
                    return "admin".to_string();
                } else if lower.contains("\"mode\": \"customer\"") || lower.contains("\"mode\":\"customer\"") || lower.contains("\"customer\"") {
                    return "customer".to_string();
                }
            }
        }
    }

    // Default fallback: "customer"
    "customer".to_string()
}

// Cleanly normalizes a Path to remove '..' and '.' relative components and UNC prefixes
fn normalize_path(path: &Path) -> String {
    if let Ok(canonical) = path.canonicalize() {
        let s = canonical.to_string_lossy().to_string();
        return s.strip_prefix(r"\\?\").unwrap_or(&s).to_string();
    }
    let s = path.to_string_lossy().to_string();
    s.strip_prefix(r"\\?\").unwrap_or(&s).to_string()
}

// Returns the absolute path to the Sound_checking folder so JS can build audio src URLs
#[tauri::command]
fn get_sound_folder_path() -> Result<String, String> {
    let mut search_dirs = Vec::new();

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            search_dirs.push(exe_dir.to_path_buf());
            if let Some(p1) = exe_dir.parent() {
                search_dirs.push(p1.to_path_buf());
                if let Some(p2) = p1.parent() {
                    search_dirs.push(p2.to_path_buf());
                    if let Some(p3) = p2.parent() {
                        search_dirs.push(p3.to_path_buf());
                    }
                }
            }
        }
    }

    if let Ok(cwd) = std::env::current_dir() {
        if !search_dirs.contains(&cwd) {
            search_dirs.push(cwd.clone());
        }
        if let Some(cwd_parent) = cwd.parent() {
            let cwd_parent_buf = cwd_parent.to_path_buf();
            if !search_dirs.contains(&cwd_parent_buf) {
                search_dirs.push(cwd_parent_buf);
            }
        }
    }

    search_dirs.push(PathBuf::from(r"C:\BC Elite QC"));
    search_dirs.push(PathBuf::from(r"C:\BizzCoHub QC"));
    search_dirs.push(PathBuf::from(r"X:\BC Elite QC"));
    search_dirs.push(PathBuf::from(r"X:\BizzCoHub QC"));

    for dir in &search_dirs {
        let sound_cand = dir.join("Sound_checking");
        if sound_cand.exists() {
            return Ok(normalize_path(&sound_cand));
        }
        let dist_sound = dir.join("dist").join("Sound_checking");
        if dist_sound.exists() {
            return Ok(normalize_path(&dist_sound));
        }
    }

    // Default fallback: create next to exe or cwd
    let target = if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            if exe_dir.file_name().and_then(|n| n.to_str()) == Some("Master Checker") {
                if let Some(parent) = exe_dir.parent() {
                    parent.join("Sound_checking")
                } else {
                    exe_dir.join("Sound_checking")
                }
            } else {
                exe_dir.join("Sound_checking")
            }
        } else {
            PathBuf::from("Sound_checking")
        }
    } else {
        PathBuf::from("Sound_checking")
    };

    let _ = fs::create_dir_all(&target);
    Ok(normalize_path(&target))
}

// Returns a list of audio file names in the Sound_checking folder
#[tauri::command]
fn get_sound_files() -> Result<Vec<String>, String> {
    let folder_str = match get_sound_folder_path() {
        Ok(path) => path,
        Err(_) => return Ok(vec![]),
    };
    let folder_path = Path::new(&folder_str);
    if !folder_path.exists() {
        let _ = fs::create_dir_all(folder_path);
    }
    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(folder_path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    if matches!(ext_lower.as_str(), "mp3" | "mp4" | "wav" | "m4a" | "aac" | "ogg" | "flac" | "wma" | "webm" | "mkv") {
                        if let Some(name) = p.file_name().and_then(|n| n.to_str()) {
                            files.push(name.to_string());
                        }
                    }
                }
            }
        }
    }
    files.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
    Ok(files)
}

// Opens the Sound_checking folder natively in Windows Explorer
#[tauri::command]
fn open_sound_folder() -> Result<(), String> {
    let folder_str = get_sound_folder_path()?;
    let folder_path = Path::new(&folder_str);
    if !folder_path.exists() {
        let _ = fs::create_dir_all(folder_path);
    }

    #[cfg(target_os = "windows")]
    {
        let clean_path = folder_str.replace('/', "\\");
        Command::new("explorer")
            .arg(&clean_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        Command::new("open")
            .arg(&folder_str)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
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

// Helper function to establish PostgreSQL DB connection efficiently
async fn get_db_client() -> Result<tokio_postgres::Client, String> {
    let conn_str = "host=ep-restless-wave-aytxak6k-pooler.c-5.us-east-2.aws.neon.tech port=5432 dbname=neondb user=neondb_owner password=npg_3xEmveHMs5za sslmode=require";

    let connector = native_tls::TlsConnector::builder()
        .danger_accept_invalid_certs(false)
        .build()
        .map_err(|e| format!("TLS connector error: {}", e))?;
    let connector = postgres_native_tls::MakeTlsConnector::new(connector);

    let (client, connection) = tokio_postgres::connect(conn_str, connector)
        .await
        .map_err(|e| format!("DB connection failed: {}", e))?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("DB connection error: {}", e);
        }
    });

    Ok(client)
}

// 11. Direct Neon PostgreSQL authentication — queries ap_users and verifies SHA-256 password hash
#[tauri::command]
async fn auth_user(username: String, password: String) -> Result<String, String> {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let entered_hash = hex::encode(hasher.finalize());

    let client = get_db_client().await?;

    let rows = client
        .query(
            "SELECT id, username, password_hash, role, status FROM ap_users WHERE LOWER(username) = LOWER($1) AND status = 'Active' LIMIT 1",
            &[&username],
        )
        .await
        .map_err(|e| format!("DB query failed: {}", e))?;

    if rows.is_empty() {
        return Err("User not found or account inactive.".to_string());
    }

    let row = &rows[0];
    let db_hash: String = row.get("password_hash");
    let user_id: i32 = row.get("id");
    let user_role: String = row.get("role");
    let db_username: String = row.get("username");

    if db_hash != entered_hash {
        return Err("Invalid password. Access denied.".to_string());
    }

    let result = serde_json::json!({
        "success": true,
        "id": user_id,
        "username": db_username,
        "role": user_role
    });

    Ok(result.to_string())
}

// 12. Direct Neon PostgreSQL batch upload — inserts or updates records in qc_device_upload table
#[tauri::command]
async fn save_qc_device_upload(payload_json: String) -> Result<String, String> {
    let val: serde_json::Value = serde_json::from_str(&payload_json)
        .map_err(|e| format!("Invalid JSON payload: {}", e))?;

    let batch_code = val["batchCode"].as_str().or(val["batch_code"].as_str()).unwrap_or("").to_string();
    let serial_number = val["serialNumber"].as_str().or(val["serial_number"].as_str()).unwrap_or("").to_string();

    if batch_code.is_empty() || serial_number.is_empty() {
        return Err("batchCode and serialNumber are required.".to_string());
    }

    let product_name = val["productName"].as_str().or(val["product_name"].as_str()).unwrap_or("").to_string();
    let brand = val["brand"].as_str().unwrap_or("").to_string();
    let series = val["series"].as_str().unwrap_or("").to_string();
    let model = val["model"].as_str().unwrap_or("").to_string();
    let condition = val["condition"].as_str().unwrap_or("Refurbished (C Grade)").to_string();
    let cpu = val["cpu"].as_str().unwrap_or("").to_string();
    let gen = val["gen"].as_str().unwrap_or("").to_string();
    let display_res = val["displayRes"].as_str().or(val["display_res"].as_str()).unwrap_or("").to_string();
    let ram_brand = val["ramBrand"].as_str().or(val["ram_brand"].as_str()).unwrap_or("").to_string();
    let ram_size = val["ramSize"].as_str().or(val["ram_size"].as_str()).unwrap_or("").to_string();
    let ssd_brand = val["ssdBrand"].as_str().or(val["ssd_brand"].as_str()).unwrap_or("").to_string();
    let ssd_size = val["ssdSize"].as_str().or(val["ssd_size"].as_str()).unwrap_or("").to_string();
    let graphics_brand = val["graphicsBrand"].as_str().or(val["graphics_brand"].as_str()).unwrap_or("").to_string();
    let graphics_size = val["graphicsSize"].as_str().or(val["graphics_size"].as_str()).unwrap_or("").to_string();
    let unit_price = val["unitPrice"].as_str().or(val["unit_price"].as_str()).unwrap_or("").to_string();
    let section = val["section"].as_str().unwrap_or("Stock").to_string();
    let common_issues = val["commonIssues"].as_str().or(val["issues"].as_str()).unwrap_or("None").to_string();
    let operator = val["operator"].as_str().unwrap_or("Operator").to_string();
    let session_id = val["sessionId"].as_str().or(val["session_id"].as_str()).unwrap_or("").to_string();
    let specs_val = val.get("specs").cloned().unwrap_or_else(|| val.clone());

    let client = get_db_client().await?;

    let sql = "
        INSERT INTO qc_device_upload (
            batch_code, serial_number, product_name, brand, series, model,
            condition, cpu, gen, display_res, ram_brand, ram_size,
            ssd_brand, ssd_size, graphics_brand, graphics_size,
            unit_price, section, common_issues, operator, session_id, specs_json, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb, CURRENT_TIMESTAMP
        )
        ON CONFLICT (batch_code, serial_number) DO UPDATE SET
            product_name = EXCLUDED.product_name,
            brand = EXCLUDED.brand,
            series = EXCLUDED.series,
            model = EXCLUDED.model,
            condition = EXCLUDED.condition,
            cpu = EXCLUDED.cpu,
            gen = EXCLUDED.gen,
            display_res = EXCLUDED.display_res,
            ram_brand = EXCLUDED.ram_brand,
            ram_size = EXCLUDED.ram_size,
            ssd_brand = EXCLUDED.ssd_brand,
            ssd_size = EXCLUDED.ssd_size,
            graphics_brand = EXCLUDED.graphics_brand,
            graphics_size = EXCLUDED.graphics_size,
            unit_price = EXCLUDED.unit_price,
            section = EXCLUDED.section,
            common_issues = EXCLUDED.common_issues,
            operator = EXCLUDED.operator,
            session_id = EXCLUDED.session_id,
            specs_json = EXCLUDED.specs_json,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id;
    ";

    let rows = client
        .query(
            sql,
            &[
                &batch_code,
                &serial_number,
                &product_name,
                &brand,
                &series,
                &model,
                &condition,
                &cpu,
                &gen,
                &display_res,
                &ram_brand,
                &ram_size,
                &ssd_brand,
                &ssd_size,
                &graphics_brand,
                &graphics_size,
                &unit_price,
                &section,
                &common_issues,
                &operator,
                &session_id,
                &specs_val,
            ],
        )
        .await
        .map_err(|e| format!("DB operation failed: {}", e))?;

    if rows.is_empty() {
        return Err("No row returned.".to_string());
    }

    let inserted_id: i32 = rows[0].get(0);
    Ok(format!("Successfully saved record ID {} to qc_device_upload", inserted_id))
}


// 13. Direct Neon PostgreSQL batch search — retrieves records from qc_device_upload table
#[tauri::command]
async fn get_qc_device_uploads(batch_code: String) -> Result<String, String> {
    let client = get_db_client().await?;

    let rows = client
        .query(
            "SELECT id, batch_code, serial_number, product_name, brand, series, model, condition, \
             cpu, gen, display_res, ram_brand, ram_size, ssd_brand, ssd_size, graphics_brand, graphics_size, \
             unit_price, section, common_issues, operator, session_id, specs_json, created_at, updated_at \
             FROM qc_device_upload WHERE LOWER(batch_code) = LOWER($1) ORDER BY updated_at DESC",
            &[&batch_code],
        )
        .await
        .map_err(|e| format!("DB query failed: {}", e))?;

    let mut records = Vec::new();
    for row in rows {
        let specs_json_val: serde_json::Value = row.get("specs_json");
        let rec = serde_json::json!({
            "id": row.get::<_, i32>("id"),
            "batchCode": row.get::<_, String>("batch_code"),
            "serialNumber": row.get::<_, String>("serial_number"),
            "productName": row.get::<_, Option<String>>("product_name"),
            "brand": row.get::<_, Option<String>>("brand"),
            "series": row.get::<_, Option<String>>("series"),
            "model": row.get::<_, Option<String>>("model"),
            "condition": row.get::<_, Option<String>>("condition"),
            "cpu": row.get::<_, Option<String>>("cpu"),
            "gen": row.get::<_, Option<String>>("gen"),
            "displayRes": row.get::<_, Option<String>>("display_res"),
            "ramBrand": row.get::<_, Option<String>>("ram_brand"),
            "ramSize": row.get::<_, Option<String>>("ram_size"),
            "ssdBrand": row.get::<_, Option<String>>("ssd_brand"),
            "ssdSize": row.get::<_, Option<String>>("ssd_size"),
            "graphicsBrand": row.get::<_, Option<String>>("graphics_brand"),
            "graphicsSize": row.get::<_, Option<String>>("graphics_size"),
            "unitPrice": row.get::<_, Option<String>>("unit_price"),
            "section": row.get::<_, Option<String>>("section"),
            "commonIssues": row.get::<_, Option<String>>("common_issues"),
            "operator": row.get::<_, Option<String>>("operator"),
            "sessionId": row.get::<_, Option<String>>("session_id"),
            "specs": specs_json_val
        });
        records.push(rec);
    }

    Ok(serde_json::to_string(&records).unwrap_or_default())
}

// 14. Direct Neon PostgreSQL batch summary — retrieves distinct batches & device counts from qc_device_upload table
#[tauri::command]
async fn get_qc_device_batches() -> Result<String, String> {
    let client = get_db_client().await?;

    let rows = client
        .query(
            "SELECT batch_code, COUNT(*)::int as device_count \
             FROM qc_device_upload \
             GROUP BY batch_code \
             ORDER BY MAX(updated_at) DESC",
            &[],
        )
        .await
        .map_err(|e| format!("DB query failed: {}", e))?;

    let mut batches = Vec::new();
    for row in rows {
        let batch_code: String = row.get("batch_code");
        let device_count: i32 = row.get("device_count");
        batches.push(serde_json::json!({
            "batchCode": batch_code,
            "deviceCount": device_count
        }));
    }

    Ok(serde_json::to_string(&batches).unwrap_or_default())
}

// 15. Direct Neon PostgreSQL delete batch — deletes all device records under a batch_code from qc_device_upload table
#[tauri::command]
async fn delete_qc_device_batch(batch_code: String) -> Result<String, String> {
    if batch_code.trim().is_empty() {
        return Err("Batch code is required.".to_string());
    }

    let client = get_db_client().await?;

    let count = client
        .execute(
            "DELETE FROM qc_device_upload WHERE LOWER(batch_code) = LOWER($1)",
            &[&batch_code],
        )
        .await
        .map_err(|e| format!("DB delete operation failed: {}", e))?;

    Ok(format!("Deleted {} records for batch '{}' from qc_device_upload", count, batch_code))
}

// 16. Direct Neon PostgreSQL delete single device record by batch_code & serial_number
#[tauri::command]
async fn delete_qc_device_record(batch_code: String, serial_number: String) -> Result<String, String> {
    if batch_code.trim().is_empty() || serial_number.trim().is_empty() {
        return Err("batchCode and serialNumber are required.".to_string());
    }

    let client = get_db_client().await?;

    let count = client
        .execute(
            "DELETE FROM qc_device_upload WHERE LOWER(batch_code) = LOWER($1) AND LOWER(serial_number) = LOWER($2)",
            &[&batch_code, &serial_number],
        )
        .await
        .map_err(|e| format!("DB delete operation failed: {}", e))?;

    Ok(format!("Deleted {} device record from qc_device_upload", count))
}

// Auto-discover bundled fixed-version WebView2 runtime if present (for Live OS / WinPE / offline environments)
fn init_environment() {
    #[cfg(windows)]
    {
        // 1. Always set WebView2 user data folder to a safe writable temporary directory
        // In WinPE / Live OS, the OS drive (X:) RAM disk is writable (%TEMP% = X:\Temp or X:\Users\Default\AppData\Local\Temp).
        // Setting user data folder here prevents crashes on read-only USBs / CD-ROMs.
        if std::env::var("WEBVIEW2_USER_DATA_FOLDER").is_err() {
            let temp_udf = std::env::temp_dir().join("BCEliteQC_WebView2");
            let _ = fs::create_dir_all(&temp_udf);
            std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", &temp_udf);
        }

        // 2. Discover local fixed WebView2 runtime folder if present (e.g. for WinPE / Live OS USB)
        if std::env::var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER").is_err() {
            let mut search_roots = Vec::new();

            // Check current executable hierarchy
            if let Ok(exe_path) = std::env::current_exe() {
                if let Some(exe_dir) = exe_path.parent() {
                    search_roots.push(exe_dir.to_path_buf());
                    if let Some(p1) = exe_dir.parent() {
                        search_roots.push(p1.to_path_buf());
                        if let Some(p2) = p1.parent() {
                            search_roots.push(p2.to_path_buf());
                        }
                    }
                }
            }

            // Check current working directory hierarchy
            if let Ok(cwd) = std::env::current_dir() {
                if !search_roots.contains(&cwd) {
                    search_roots.push(cwd.clone());
                }
                if let Some(p) = cwd.parent() {
                    let p_buf = p.to_path_buf();
                    if !search_roots.contains(&p_buf) {
                        search_roots.push(p_buf);
                    }
                }
            }

            // Check standard Live OS drives (X:\, U:\, E:\, D:\, etc.)
            for &drive in &[b'X', b'U', b'Y', b'Z', b'D', b'E', b'F', b'G', b'H', b'C'] {
                let drive_root = PathBuf::from(format!("{}:\\", drive as char));
                if drive_root.exists() {
                    search_roots.push(drive_root.join("BC Elite QC"));
                    search_roots.push(drive_root.join("BizzCoHub QC"));
                    search_roots.push(drive_root.join("Programs"));
                    search_roots.push(drive_root);
                }
            }

            let fixed_folder_names = [
                "WebView2Runtime",
                "EBWebView",
                "FixedRuntime",
                "Microsoft.WebView2.FixedVersionRuntime",
                "webview2",
                "runtime",
            ];

            fn check_runtime_dir(dir: &Path) -> Option<PathBuf> {
                if !dir.exists() || !dir.is_dir() {
                    return None;
                }
                // Check if msedgewebview2.exe / msedge.dll is directly inside
                if dir.join("msedgewebview2.exe").exists() || dir.join("msedge.dll").exists() {
                    return Some(dir.to_path_buf());
                }
                // Check if there is a versioned subfolder (e.g. 154.0.4258.37\msedgewebview2.exe)
                if let Ok(entries) = fs::read_dir(dir) {
                    for entry in entries.flatten() {
                        let sub = entry.path();
                        if sub.is_dir() && (sub.join("msedgewebview2.exe").exists() || sub.join("msedge.dll").exists()) {
                            return Some(sub);
                        }
                    }
                }
                None
            }

            let mut found_fixed = None;
            for root in &search_roots {
                for name in &fixed_folder_names {
                    if let Some(valid_path) = check_runtime_dir(&root.join(name)) {
                        found_fixed = Some(valid_path);
                        break;
                    }
                }
                if found_fixed.is_some() {
                    break;
                }
            }

            if let Some(fixed_dir) = found_fixed {
                std::env::set_var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER", &fixed_dir);
                return;
            }

            // 3. If no local fixed runtime is bundled, verify if system Evergreen WebView2 is installed
            let keys = [
                r"HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
                r"HKLM\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
                r"HKCU\Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
            ];
            let mut is_installed = false;
            for key in &keys {
                if let Ok(output) = std::process::Command::new("reg")
                    .args(&["query", key, "/v", "pv"])
                    .output()
                {
                    if output.status.success() {
                        let stdout = String::from_utf8_lossy(&output.stdout);
                        if stdout.contains("REG_SZ") && !stdout.contains("0.0.0.0") {
                            is_installed = true;
                            break;
                        }
                    }
                }
            }

            // 4. If system WebView2 is NOT installed, run offline standalone or bootstrapper installer silently
            if !is_installed {
                for root in &search_roots {
                    let standalone = root.join("MicrosoftEdgeWebView2RuntimeInstallerX64.exe");
                    if standalone.is_file() {
                        let _ = std::process::Command::new(&standalone)
                            .args(&["/silent", "/install"])
                            .status();
                        break;
                    }
                    let bootstrapper = root.join("MicrosoftEdgeWebview2Setup.exe");
                    if bootstrapper.is_file() {
                        let _ = std::process::Command::new(&bootstrapper)
                            .args(&["/silent", "/install"])
                            .status();
                        break;
                    }
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_environment();

    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Register global shortcut for Print Screen key to bypass OS interception
            #[cfg(desktop)]
            {
                use tauri::Emitter;
                use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Shortcut, ShortcutState};

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app, _shortcut, event| {
                            if event.state() == ShortcutState::Pressed {
                                let _ = app.emit("print-screen-pressed", "pressed");
                            }
                        })
                        .build(),
                )?;

                let shortcut = Shortcut::new(None, Code::PrintScreen);
                let _ = app.global_shortcut().register(shortcut);
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
            set_fullscreen,
            get_app_version,
            get_app_mode,
            get_sound_folder_path,
            get_sound_files,
            open_sound_folder,
            http_post,
            http_get,
            auth_user,
            save_qc_device_upload,
            get_qc_device_uploads,
            get_qc_device_batches,
            delete_qc_device_batch,
            delete_qc_device_record
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

