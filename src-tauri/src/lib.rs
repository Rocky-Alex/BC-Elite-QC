use std::process::Command;
use std::path::{Path, PathBuf};
use std::fs;
use sha2::{Sha256, Digest};

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
    // First check default installation path
    let default_install = PathBuf::from(r"C:\BizzCoHub QC\Sound_checking");
    if default_install.exists() {
        return Ok(normalize_path(&default_install));
    }

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let candidates = vec![
                exe_dir.join("Sound_checking"),
                exe_dir.join("..").join("Sound_checking"),
                exe_dir.join("..").join("..").join("Sound_checking"),
                exe_dir.join("..").join("..").join("..").join("Sound_checking"),
            ];
            for candidate in candidates {
                if candidate.exists() {
                    return Ok(normalize_path(&candidate));
                }
            }
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        let candidates = vec![
            cwd.join("Sound_checking"),
            cwd.join("dist").join("Sound_checking"),
        ];
        for candidate in candidates {
            if candidate.exists() {
                return Ok(normalize_path(&candidate));
            }
        }
    }

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
        } else if let Ok(cwd) = std::env::current_dir() {
            cwd.join("Sound_checking")
        } else {
            PathBuf::from("Sound_checking")
        }
    } else if let Ok(cwd) = std::env::current_dir() {
        cwd.join("Sound_checking")
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
    let conn_str = "host=ep-restless-wave-aytxak6k-pooler.c-5.us-east-2.aws.neon.tech \
        port=5432 \
        dbname=neondb \
        user=neondb_owner \
        password=npg_3xEmveHMs5za \
        sslmode=require";

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

