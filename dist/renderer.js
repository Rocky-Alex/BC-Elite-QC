// Wait for DOM to load
function init() {
  // Tauri IPC Bridge wrapper mapping Electron methods to Tauri commands
  const electronAPI = {
    windowControl: async (action) => {
      try {
        await window.__TAURI__.core.invoke('window_control', { action });
      } catch (err) {
        console.error('Failed to control window:', err);
      }
    },
    getSystemSpec: async (command) => {
      try {
        const data = await window.__TAURI__.core.invoke('get_system_spec', { command });
        return { success: true, data };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    checkToolExists: async (fileName, folderName) => {
      try {
        return await window.__TAURI__.core.invoke('check_tool_exists', { fileName, folderName });
      } catch (err) {
        return false;
      }
    },
    launchTool: async (fileName, folderName) => {
      try {
        const data = await window.__TAURI__.core.invoke('launch_tool', { fileName, folderName });
        return { success: true, data };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    launchSystemTool: async (command) => {
      try {
        await window.__TAURI__.core.invoke('launch_system_tool', { command });
        return { success: true };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    runBatteryDiagnostics: async () => {
      try {
        const xmlPath = await window.__TAURI__.core.invoke('run_battery_diagnostics');
        return { success: true, xmlPath };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    saveTableFile: async (data, fileName) => {
      try {
        const filePath = await window.__TAURI__.core.invoke('save_table_file', { data, fileName });
        return { success: true, filePath };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    getAppVersion: async () => {
      try {
        const version = await window.__TAURI__.core.invoke('get_app_version');
        return { success: true, version };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    readFileContent: async (filePath) => {
      try {
        const content = await window.__TAURI__.core.invoke('read_file_content', { filePath });
        return { success: true, content };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    httpPost: async (url, body, token) => {
      try {
        const result = await window.__TAURI__.core.invoke('http_post', { url, body: JSON.stringify(body), token });
        return { success: true, data: JSON.parse(result) };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
    httpGet: async (url, token) => {
      try {
        const result = await window.__TAURI__.core.invoke('http_get', { url, token });
        return { success: true, data: JSON.parse(result) };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
  };

  // Cache DOM elements
  const btnMinimize = document.getElementById('win-minimize');
  const btnMaximize = document.getElementById('win-maximize');
  const btnClose = document.getElementById('win-close');

  const specProduct = document.getElementById('spec-product-name');
  const specCpu = document.getElementById('spec-cpu');
  const specRam = document.getElementById('spec-ram');
  const specSsd = document.getElementById('spec-ssd');
  const specGraphics = document.getElementById('spec-graphics');
  const specDisplay = document.getElementById('spec-display');
  const specSerial = document.getElementById('spec-serial');
  const specWindows = document.getElementById('spec-windows');

  const sessionIdVal = document.getElementById('session-id-val');
  const consoleLogs = document.getElementById('console-logs');

  const btnDetailsExport = document.getElementById('btn-details-export');
  const btnDetailsUpload = document.getElementById('btn-details-upload');
  const btnViewUploadTable = document.getElementById('btn-view-upload-table');

  const uploadTableModal = document.getElementById('upload-table-modal');
  const btnCloseUploadModal = document.getElementById('btn-close-upload-modal');
  const btnSearchBatch = document.getElementById('btn-search-batch');
  const inputSearchBatchCode = document.getElementById('input-search-batch-code');
  const uploadTableBody = document.getElementById('upload-table-body');

  // UPLOAD PORTAL DOM ELEMENTS
  const uploadPortalModal = document.getElementById('upload-portal-modal');
  const btnClosePortalModal = document.getElementById('btn-close-portal-modal');
  const portalLoginSection = document.getElementById('portal-login-section');
  const portalDashboardSection = document.getElementById('portal-dashboard-section');
  const portalUsernameInput = document.getElementById('portal-username');
  const portalPasswordInput = document.getElementById('portal-password');
  const portalLoginError = document.getElementById('portal-login-error');
  const btnPortalLogin = document.getElementById('btn-portal-login');
  const portalLoggedUser = document.getElementById('portal-logged-user');
  const btnPortalLogout = document.getElementById('btn-portal-logout');
  const btnPortalCreateBatch = document.getElementById('btn-portal-create-batch');
  const btnPortalViewHistory = document.getElementById('btn-portal-view-history');
  const btnPortalUpdateDetails = document.getElementById('btn-portal-update-details');
  const btnPortalExportExcel = document.getElementById('btn-portal-export-excel');
  const btnPortalExportPdf = document.getElementById('btn-portal-export-pdf');

  const testHdSentinel = document.getElementById('test-hd-sentinel');
  const testLcd = document.getElementById('test-lcd');
  const testCpuz = document.getElementById('test-cpuz');
  const testBattery = document.getElementById('test-battery');
  const testKeyboard = document.getElementById('test-keyboard');
  const testSound = document.getElementById('test-sound');
  const btnAutoRun = document.getElementById('btn-auto-run');
  const btnGlobalCheck = null;

  // Theme elements
  const themeBtnDark = document.getElementById('theme-btn-dark');
  const themeBtnLight = document.getElementById('theme-btn-light');

  // Theme Switching Logic
  function setTheme(theme) {
    if (theme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      if (themeBtnLight) themeBtnLight.classList.add('active');
      if (themeBtnDark) themeBtnDark.classList.remove('active');
      localStorage.setItem('qc_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      if (themeBtnDark) themeBtnDark.classList.add('active');
      if (themeBtnLight) themeBtnLight.classList.remove('active');
      localStorage.setItem('qc_theme', 'dark');
    }
  }

  // Bind click events for theme buttons
  if (themeBtnDark) {
    themeBtnDark.addEventListener('click', () => {
      setTheme('dark');
      log('Interface theme switched to Dark Mode.', 'info');
    });
  }
  if (themeBtnLight) {
    themeBtnLight.addEventListener('click', () => {
      setTheme('light');
      log('Interface theme switched to Light Mode.', 'info');
    });
  }

  // Load persisted theme or default to system theme or light mode
  const savedTheme = localStorage.getItem('qc_theme') || 'light';
  setTheme(savedTheme);

  // Modal elements
  const modalOverlay = document.getElementById('table-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnModalRefresh = document.getElementById('btn-modal-refresh');
  const btnModalClear = document.getElementById('btn-modal-clear');
  const tableBody = document.getElementById('table-body');

  // Specs object to hold retrieved data
  const systemSpecs = {
    productName: '',
    cpu: '',
    ram: '',
    ssd: '',
    graphics: '',
    displayRes: '',
    serialNumber: '',
    windowsVer: '',
    battery: ''
  };

  // Generate Session ID
  const sessionId = `BH-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
  sessionIdVal.textContent = sessionId;

  // Session Operator name variable
  let currentOperator = '';
  let activeBatchCode = '';

  // Console logging function
  function log(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'log-line';

    let prefix = '[INFO]';
    let typeClass = 'log-info';

    switch (type.toLowerCase()) {
      case 'debug':
        prefix = '[DEBUG]';
        typeClass = 'log-debug';
        break;
      case 'warn':
        prefix = '[WARN]';
        typeClass = 'log-warn';
        break;
      case 'error':
        prefix = '[ERROR]';
        typeClass = 'log-error';
        break;
      case 'ready':
        prefix = '[READY]';
        typeClass = 'log-ready';
        break;
    }

    line.innerHTML = `<span class="${typeClass}">${prefix}</span> ${message}`;
    consoleLogs.appendChild(line);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
  }

  // Custom macOS modal alert helper
  function showCustomAlert(message, title = 'System Notification', type = 'info') {
    const alertModal = document.getElementById('custom-alert-modal');
    const alertTitle = document.getElementById('custom-alert-title');
    const alertMsg = document.getElementById('custom-alert-message');
    const alertIcon = document.getElementById('custom-alert-icon');
    const btnOk = document.getElementById('btn-custom-alert-ok');

    alertTitle.textContent = title;
    alertMsg.textContent = message;

    // Set icon class and color based on type
    if (type === 'error') {
      alertIcon.className = 'fa-solid fa-circle-xmark';
      alertIcon.style.color = 'var(--color-red)';
    } else if (type === 'warn') {
      alertIcon.className = 'fa-solid fa-circle-exclamation';
      alertIcon.style.color = 'var(--color-orange)';
    } else {
      alertIcon.className = 'fa-solid fa-circle-info';
      alertIcon.style.color = 'var(--color-blue)';
    }

    alertModal.style.display = 'flex';
    setTimeout(() => { alertModal.classList.add('open'); }, 10);

    btnOk.onclick = () => {
      alertModal.classList.remove('open');
      setTimeout(() => { alertModal.style.display = 'none'; }, 300);
    };
  }

  // Window Controls
  btnMinimize.addEventListener('click', () => electronAPI.windowControl('minimize'));
  btnMaximize.addEventListener('click', () => electronAPI.windowControl('maximize'));
  btnClose.addEventListener('click', () => electronAPI.windowControl('close'));

  // Helper to update maximize button icon
  function updateMaximizeIcon(isMaximized) {
    const icon = btnMaximize.querySelector('i');
    if (icon) {
      if (isMaximized) {
        icon.className = 'fa-regular fa-copy'; // Restore icon (overlapping squares)
      } else {
        icon.className = 'fa-regular fa-square'; // Maximize icon (single square)
      }
    }
  }

  // Update maximize icon state on window resize (works for standard resize, maximize, snap layout)
  window.addEventListener('resize', async () => {
    try {
      if (window.__TAURI__) {
        const appWindow = window.__TAURI__.window.getCurrentWindow();
        const maximized = await appWindow.isMaximized();
        updateMaximizeIcon(maximized);
      }
    } catch (err) {
      console.error('Failed to query maximized state:', err);
    }
  });

  // Query maximized state on startup in Tauri
  if (window.__TAURI__) {
    window.__TAURI__.window.getCurrentWindow().isMaximized().then(updateMaximizeIcon).catch(console.error);
  }

  // Run a powershell spec query and update text content
  async function querySpec(command, element, specKey, fallbackVal) {
    try {
      const result = await electronAPI.getSystemSpec(command);
      if (result.success && result.data) {
        // Clean double quotes, extra white space
        const cleanData = result.data.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
        element.textContent = cleanData;
        systemSpecs[specKey] = cleanData;
      } else {
        element.textContent = fallbackVal;
        systemSpecs[specKey] = fallbackVal;
      }
    } catch (err) {
      element.textContent = fallbackVal;
      systemSpecs[specKey] = fallbackVal;
    }
  }

  // Helper to categorize battery health
  function getBatteryStatus(percent) {
    const val = parseInt(percent, 10);
    if (isNaN(val)) return { text: '', color: '' };

    // Load limits dynamically from localStorage with defaults
    const excellentMin = parseInt(localStorage.getItem('setting_excellent_min') || '80', 10);
    const excellentMax = parseInt(localStorage.getItem('setting_excellent_max') || '100', 10);
    const goodMin = parseInt(localStorage.getItem('setting_good_min') || '50', 10);
    const goodMax = parseInt(localStorage.getItem('setting_good_max') || '79', 10);
    const badMin = parseInt(localStorage.getItem('setting_bad_min') || '0', 10);
    const badMax = parseInt(localStorage.getItem('setting_bad_max') || '49', 10);

    if (val >= badMin && val <= badMax) {
      return { text: 'Bad', color: 'var(--color-red)' };
    } else if (val >= goodMin && val <= goodMax) {
      return { text: 'Good', color: 'var(--color-orange)' };
    } else if (val >= excellentMin && val <= excellentMax) {
      return { text: 'Excellent', color: 'var(--color-green)' };
    }

    // Fallback if not within ranges
    if (val < goodMin) return { text: 'Bad', color: 'var(--color-red)' };
    if (val < excellentMin) return { text: 'Good', color: 'var(--color-orange)' };
    return { text: 'Excellent', color: 'var(--color-green)' };
  }

  // Helper to update basic specs in UI
  function renderBasicSpecsUI() {
    if (specProduct) specProduct.textContent = systemSpecs.productName;
    if (specCpu) specCpu.textContent = systemSpecs.cpu;
    if (specRam) specRam.textContent = systemSpecs.ram;
    if (specSsd) specSsd.textContent = systemSpecs.ssd;
    if (specGraphics) specGraphics.textContent = systemSpecs.graphics;
    if (specDisplay) specDisplay.textContent = systemSpecs.displayRes;
    if (specSerial) specSerial.textContent = systemSpecs.serialNumber;
    if (specWindows) specWindows.textContent = systemSpecs.windowsVer;

    const specBatteryHealth = document.getElementById('spec-battery-health');
    if (specBatteryHealth && systemSpecs.battery) {
      const match = systemSpecs.battery.match(/(\d+)%/);
      if (match) {
        const percent = parseInt(match[1], 10);
        const status = getBatteryStatus(percent);
        const cyclesMatch = systemSpecs.battery.match(/\(([^)]+)\)/);
        const cyclesStr = cyclesMatch ? ` (${cyclesMatch[1]})` : '';
        specBatteryHealth.innerHTML = `<span style="color: ${status.color}; font-weight: 700;">${percent}% (${status.text})</span>${cyclesStr}`;
      } else {
        specBatteryHealth.textContent = systemSpecs.battery;
      }
    }
  }

  // Set UI elements to temporary placeholder states during fetching
  function setUIStatesToDetecting() {
    if (specProduct) specProduct.textContent = 'Detecting...';
    if (specCpu) specCpu.textContent = 'Detecting...';
    if (specRam) specRam.textContent = 'Detecting...';
    if (specSsd) specSsd.textContent = 'Detecting...';
    if (specGraphics) specGraphics.textContent = 'Detecting...';
    if (specDisplay) specDisplay.textContent = 'Detecting...';
    if (specSerial) specSerial.textContent = 'Detecting...';
    if (specWindows) specWindows.textContent = 'Detecting...';
    
    const specBatteryHealth = document.getElementById('spec-battery-health');
    if (specBatteryHealth) specBatteryHealth.textContent = 'Detecting...';
    
    const detailRamSlots = document.getElementById('detail-ram-slots');
    if (detailRamSlots) detailRamSlots.innerHTML = '<div class="spec-row"><span class="spec-label">Querying RAM slots details...</span></div>';
    
    const detailSsdList = document.getElementById('detail-ssd-list');
    if (detailSsdList) detailSsdList.innerHTML = '<div class="spec-row"><span class="spec-label">Querying drive parameters...</span></div>';
    
    const detailGraphicsList = document.getElementById('detail-graphics-list');
    if (detailGraphicsList) detailGraphicsList.innerHTML = '<div class="spec-row"><span class="spec-label">Querying GPU engines...</span></div>';
    
    const detailBatteryList = document.getElementById('detail-battery-list');
    if (detailBatteryList) detailBatteryList.innerHTML = '<div class="spec-row"><span class="spec-label">Querying detailed battery parameters...</span></div>';
  }

  // Fallback values if WMI script execution fails
  function setUIStatesToFallback() {
    if (specProduct) specProduct.textContent = 'Generic Laptop';
    if (specCpu) specCpu.textContent = 'Intel Core i7';
    if (specRam) specRam.textContent = '8 GB';
    if (specSsd) specSsd.textContent = '256 GB';
    if (specGraphics) specGraphics.textContent = 'Intel HD Graphics';
    if (specDisplay) specDisplay.textContent = '1920 x 1080 FHD';
    if (specSerial) specSerial.textContent = 'PC1356548';
    if (specWindows) specWindows.textContent = 'Windows 11';
    
    const specBatteryHealth = document.getElementById('spec-battery-health');
    if (specBatteryHealth) specBatteryHealth.textContent = 'N/A';
    
    const detailRamSlots = document.getElementById('detail-ram-slots');
    if (detailRamSlots) detailRamSlots.innerHTML = '<div class="spec-row"><span class="spec-label">Query failed.</span></div>';
    
    const detailSsdList = document.getElementById('detail-ssd-list');
    if (detailSsdList) detailSsdList.innerHTML = '<div class="spec-row"><span class="spec-label">Query failed.</span></div>';
    
    const detailGraphicsList = document.getElementById('detail-graphics-list');
    if (detailGraphicsList) detailGraphicsList.innerHTML = '<div class="spec-row"><span class="spec-label">Query failed.</span></div>';
    
    const detailBatteryList = document.getElementById('detail-battery-list');
    if (detailBatteryList) detailBatteryList.innerHTML = '<div class="spec-row"><span class="spec-label">Query failed.</span></div>';
  }

  let isFetchingAll = false;
  let fetchAllPromise = null;

  // Consolidate WMI and powershell calls into a single execution
  async function fetchAllSpecs(force = false) {
    if (isFetchingAll) {
      return fetchAllPromise;
    }

    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    const cachedBasic = cacheMode === 'permanently' ? localStorage.getItem('qc_basic_specs') : null;
    const cachedRam = cacheMode === 'permanently' ? localStorage.getItem('qc_detailed_ram') : null;
    const cachedSsd = cacheMode === 'permanently' ? localStorage.getItem('qc_detailed_ssd') : null;
    const cachedGpu = cacheMode === 'permanently' ? localStorage.getItem('qc_detailed_graphics') : null;
    const cachedBat = cacheMode === 'permanently' ? localStorage.getItem('qc_detailed_battery') : null;

    if (cachedBasic && cachedRam && cachedSsd && cachedGpu && cachedBat && !force) {
      log('Loaded specifications from persistent cache. Fetched details displayed at ' + new Date().toLocaleString() + '.', 'debug');
      try {
        const specs = JSON.parse(cachedBasic);
        Object.assign(systemSpecs, specs);
        renderBasicSpecsUI();
        
        renderRAMDetails(cachedRam);
        renderSSDDetails(cachedSsd);
        renderGraphicsDetails(cachedGpu);
        renderBatteryDetails(cachedBat);
        
        return;
      } catch (e) {
        log('Cache parse failed, fetching fresh specs: ' + e.message, 'warn');
      }
    }

    setUIStatesToDetecting();

    isFetchingAll = true;
    fetchAllPromise = (async () => {
      try {
        log('Pre-fetching detailed hardware configurations in a single run (3-6s)...', 'debug');

        // PowerShell script consolidates all queries into a single JSON return value
        const script = `$specs = @{}
try { $specs.productName = (Get-WmiObject -Class Win32_ComputerSystemProduct -ErrorAction SilentlyContinue).Name.Trim() } catch { $specs.productName = "Generic Laptop" }
try { $specs.cpu = (Get-WmiObject -Class Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1).Name.Trim() } catch { $specs.cpu = "Intel Core i7" }
try {
    $ramSum = (Get-WmiObject Win32_PhysicalMemory -ErrorAction SilentlyContinue | Measure-Object -Property Capacity -Sum).Sum
    $specs.ram = "$([Math]::Round($ramSum / 1GB)) GB"
} catch {
    try { $specs.ram = "$([Math]::Round((Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB)) GB" } catch { $specs.ram = "8 GB" }
}
try {
    $ssdSum = (Get-WmiObject -Class Win32_DiskDrive -ErrorAction SilentlyContinue | Measure-Object -Property Size -Sum).Sum
    $totalGb = [Math]::Round($ssdSum / 1GB)
    $specs.ssd = if ($totalGb -ge 900) { "$([Math]::Round($totalGb / 1024 * 10) / 10) TB" } else { "$totalGb GB" }
} catch { $specs.ssd = "256 GB" }
try {
    $gpus = Get-WmiObject -Class Win32_VideoController -ErrorAction SilentlyContinue | ForEach-Object {
        $n = $_.Name.Trim(); $r = $_.AdapterRAM; if ($r -lt 0) { $r = [uint32]$r }; $g = [Math]::Round($r / 1GB)
        if (($n -match 'NVIDIA|GeForce|RTX|GTX|Quadro|Arc' -or ($n -match 'AMD|Radeon' -and $n -notmatch 'Radeon.*Graphics|Vega|Processor|Integrated')) -and $g -gt 0) { "$n ($g GB)" } else { $n }
    }
    $specs.graphics = $gpus -join ' + '
} catch { $specs.graphics = "Intel HD Graphics" }
try {
    $vc = Get-WmiObject -Class Win32_VideoController -ErrorAction SilentlyContinue | Where-Object { $_.CurrentHorizontalResolution -gt 0 } | Select-Object -First 1
    $specs.displayRes = if ($vc) { "$($vc.CurrentHorizontalResolution) x $($vc.CurrentVerticalResolution)" } else { Add-Type -AssemblyName System.Windows.Forms; $s = [System.Windows.Forms.Screen]::PrimaryScreen; "$($s.Bounds.Width) x $($s.Bounds.Height)" }
} catch { $specs.displayRes = "1920 x 1080 FHD" }
try { $specs.serialNumber = (Get-WmiObject -Class Win32_BIOS -ErrorAction SilentlyContinue).SerialNumber.Trim() } catch { $specs.serialNumber = "PC1356548" }
try { $o = Get-WmiObject -Class Win32_OperatingSystem -ErrorAction SilentlyContinue; $specs.windowsVer = ($o.Caption -replace 'Microsoft ', '').Trim() + " (Build " + $o.BuildNumber + ")" } catch { $specs.windowsVer = "Windows 11" }
$batDesign = 0; $batFull = 0; $batCycles = 0; $batMfg = "Generic"; $batSerial = "N/A"; $batChem = "LIon"; $batVolt = 0
try {
    $xmlPath = "$env:TEMP\\battery_report_combined.xml"
    if (Test-Path $xmlPath) { Remove-Item $xmlPath -ErrorAction SilentlyContinue }
    & powercfg /batteryreport /xml /output $xmlPath | Out-Null
    if (Test-Path $xmlPath) {
        [xml]$xml = Get-Content $xmlPath
        $b = $xml.BatteryReport.Batteries.Battery
        if ($b) { $batDesign = [double]$b.DesignCapacity; $batFull = [double]$b.FullChargeCapacity; $batCycles = $b.CycleCount; $batMfg = $b.Manufacturer.Trim(); $batSerial = $b.SerialNumber.Trim(); $batChem = $b.Chemistry.Trim() }
        $s = Get-CimInstance -Namespace root\\wmi -ClassName BatteryStatus -ErrorAction SilentlyContinue
        if ($s) { $batVolt = $s.Voltage }
        Remove-Item $xmlPath -ErrorAction SilentlyContinue
    }
} catch {}
if ($batDesign -gt 0) {
    $health = [Math]::Round(($batFull / $batDesign) * 100)
    $specs.battery = "$health% ($batCycles cycles)"
    $specs.detailed_battery = "$batMfg|$batSerial|$batChem|$batDesign|$batFull|$batCycles|$batVolt"
} else {
    $specs.battery = "N/A (Desktop)"
    $specs.detailed_battery = "N/A"
}
try {
    $ramSlots = Get-WmiObject Win32_PhysicalMemory -ErrorAction SilentlyContinue | ForEach-Object {
        $dev = if ($_.DeviceLocator) { $_.DeviceLocator.Trim() } else { "Slot" }
        $mfg = if ($_.Manufacturer) { $_.Manufacturer.Trim() } else { "Generic" }
        $cap = [Math]::Round($_.Capacity / 1GB)
        $speed = if ($_.Speed) { $_.Speed } else { 0 }
        $part = if ($_.PartNumber) { $_.PartNumber.Trim() } else { "N/A" }
        $volt = if ($_.ConfiguredVoltage) { $_.ConfiguredVoltage } else { 0 }
        "$dev|$mfg|$cap GB|$($speed)MHz|$part|$($volt)mV"
    }
    $specs.detailed_ram = $ramSlots -join "\`n"
} catch { $specs.detailed_ram = "" }
try {
    $disks = Get-WmiObject -Class Win32_DiskDrive -ErrorAction SilentlyContinue | ForEach-Object {
        $disk = $_; $mediaType = "Unknown"; $health = "Unknown"; $life = "N/A"
        $staPath = "C:\\QC_Software\\HDSentinel\\HDSentinel.sta"
        if (-not (Test-Path $staPath)) { $staPath = "HDSentinel.sta" }
        if (-not (Test-Path $staPath)) { $staPath = "F:\\Company Software\\QC Software\\HDSentinel.sta" }
        if (Test-Path $staPath) {
            $content = [System.IO.File]::ReadLines($staPath)
            $cleanSearchSerial = ($disk.SerialNumber -replace '[^A-Za-z0-9]', '').Trim()
            $sectionFound = $false; $healthVal = $null
            foreach ($line in $content) {
                $line = $line.Trim()
                if ($line.StartsWith("[Sta_")) {
                    $cleanSectionName = ($line -replace '[^A-Za-z0-9]', '')
                    $isMatch = $false
                    if ($cleanSearchSerial -and $cleanSectionName.Contains($cleanSearchSerial)) { $isMatch = $true }
                    elseif ($disk.Model -and ($cleanSectionName.Contains(($disk.Model -replace '[^A-Za-z0-9]', '')))) { $isMatch = $true }
                    if ($isMatch) { $sectionFound = $true; continue }
                }
                if ($sectionFound) {
                    if ($line.StartsWith("[")) { break }
                    if ($line -match "^\\d+=(.+)$") {
                        $vals = $matches[1].Split(',')
                        if ($vals.Count -ge 4) { $healthVal = $vals[3].Trim() }
                        break
                    }
                }
            }
            if ($healthVal) { $health = "$healthVal% Health"; $life = "$healthVal% Life Remaining" }
        }
        $phys = Get-PhysicalDisk -ErrorAction SilentlyContinue | Where-Object { $_.Model -eq $disk.Model -or $_.DeviceId -eq [string]$disk.Index } | Select-Object -First 1
        if ($phys) {
            $mediaType = $phys.MediaType
            if ($health -eq "Unknown") {
                $health = $phys.HealthStatus
                $counter = Get-StorageReliabilityCounter -PhysicalDisk $phys -ErrorAction SilentlyContinue
                if ($counter -and $counter.Wear -ne $null) { $lifeVal = 100 - $counter.Wear; $life = "$lifeVal% Life Remaining"; $health = "$lifeVal% Health" }
            }
        }
        "$($disk.Index)|$($disk.Model.Trim())|$([Math]::Round($disk.Size/1GB)) GB|$($disk.InterfaceType)|$($disk.SerialNumber.Trim())|$mediaType|$($disk.Partitions)|$health|$life"
    }
    $specs.detailed_ssd = $disks -join "\`n"
} catch { $specs.detailed_ssd = "" }
try {
    $gpuDetails = Get-WmiObject -Class Win32_VideoController -ErrorAction SilentlyContinue | ForEach-Object {
        $gpu = $_; $name = $gpu.Name.Trim(); $proc = if ($gpu.VideoProcessor) { $gpu.VideoProcessor.Trim() } else { "N/A" }; $drv = if ($gpu.DriverVersion) { $gpu.DriverVersion.Trim() } else { "N/A" }
        $ram = $gpu.AdapterRAM; if ($ram -lt 0) { $ram = [uint32]$ram }; $gb = "$([Math]::Round($ram / 1GB)) GB"
        $res = "$($gpu.CurrentHorizontalResolution) x $($gpu.CurrentVerticalResolution)"; $ref = "$($gpu.CurrentRefreshRate) Hz"
        "$name|$proc|$drv|$gb|$res|$ref"
    }
    $specs.detailed_graphics = $gpuDetails -join "\`n"
} catch { $specs.detailed_graphics = "" }
$specs | ConvertTo-Json`;

        // Pass the raw script directly to Tauri backend, which executes it via a temp file
        const result = await electronAPI.getSystemSpec(script);
        if (result.success && result.data) {
          const rawJson = result.data.trim();
          
          // Robust JSON parsing (extract substring between first '{' and last '}')
          const jsonStart = rawJson.indexOf('{');
          const jsonEnd = rawJson.lastIndexOf('}');
          if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error("Invalid JSON formatting returned from discovery script");
          }
          const cleanJson = rawJson.substring(jsonStart, jsonEnd + 1);
          const data = JSON.parse(cleanJson);
          
          systemSpecs.productName = data.productName || 'Generic Laptop';
          systemSpecs.cpu = data.cpu || 'Intel Core i7';
          systemSpecs.ram = data.ram || '8 GB';
          systemSpecs.ssd = data.ssd || '256 GB';
          systemSpecs.graphics = data.graphics || 'Intel HD Graphics';
          systemSpecs.displayRes = data.displayRes || '1920 x 1080 FHD';
          systemSpecs.serialNumber = data.serialNumber || 'PC1356548';
          systemSpecs.windowsVer = data.windowsVer || 'Windows 11';
          systemSpecs.battery = data.battery || 'N/A';

          renderBasicSpecsUI();

          if (data.detailed_ram) {
            renderRAMDetails(data.detailed_ram);
            if (cacheMode !== 'temporary') {
              localStorage.setItem('qc_detailed_ram', data.detailed_ram);
            }
          }
          if (data.detailed_ssd) {
            renderSSDDetails(data.detailed_ssd);
            if (cacheMode !== 'temporary') {
              localStorage.setItem('qc_detailed_ssd', data.detailed_ssd);
            }
          }
          if (data.detailed_graphics) {
            renderGraphicsDetails(data.detailed_graphics);
            if (cacheMode !== 'temporary') {
              localStorage.setItem('qc_detailed_graphics', data.detailed_graphics);
            }
          }
          if (data.detailed_battery && data.detailed_battery !== 'N/A') {
            renderBatteryDetails(data.detailed_battery);
            if (cacheMode !== 'temporary') {
              localStorage.setItem('qc_detailed_battery', data.detailed_battery);
            }
          }

          if (cacheMode === 'permanently') {
            localStorage.setItem('qc_basic_specs', JSON.stringify(systemSpecs));
          }

          log('Hardware discovery completed successfully. Fetched details displayed at ' + new Date().toLocaleString() + '.', 'ready');
        } else {
          throw new Error(result.error || 'Failed to fetch specifications');
        }
      } catch (err) {
        log(`Error in unified hardware discovery: ${err.message}`, 'error');
        setUIStatesToFallback();
      } finally {
        isFetchingAll = false;
        fetchAllPromise = null;
      }
    })();

    return fetchAllPromise;
  }

  // Retrieve all specifications on load
  async function loadSpecifications() {
    // Clear cache based on settings
    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    if (cacheMode === 'autoclear' || cacheMode === 'temporary') {
      localStorage.removeItem('qc_detailed_ram');
      localStorage.removeItem('qc_detailed_ssd');
      localStorage.removeItem('qc_detailed_graphics');
      localStorage.removeItem('qc_detailed_battery');
      localStorage.removeItem('qc_basic_specs');
    }

    log('System diagnostics console initialized.', 'info');
    log('Starting hardware discovery...', 'debug');

    // Save record to history database automatically on start
    saveRecordToHistory('Initialized');

    await fetchAllSpecs(false);
  }

  // Query and update version
  async function updateAppVersion() {
    try {
      const result = await electronAPI.getAppVersion();
      if (result.success && result.version) {
        const ver = result.version;
        systemSpecs.appVersion = ver; // Store version globally
        const verVal = document.getElementById('app-version-val');
        if (verVal) verVal.textContent = ver;

        const sideBadge = document.querySelector('.version-badge');
        if (sideBadge) sideBadge.textContent = `SYSTEM V${ver}`;

        // Trigger auto-updater check
        checkForUpdates(ver);
      }
    } catch (e) {
      console.error('Failed to update app version:', e);
    }
  }

  // Auto-Updater Check using GitHub Releases REST API
  async function checkForUpdates(currentVersion) {
    try {
      const repoOwner = 'Rocky-Alex';
      const repoName = 'BC-Elite-QC';

      log(`Checking for updates (current version: ${currentVersion})...`, 'info');

      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`);
      if (!response.ok) {
        log(`Update check bypassed: GitHub API returned status ${response.status}`, 'debug');
        return;
      }

      const release = await response.json();
      const latestVersion = release.tag_name.replace('v', '').trim();

      log(`Latest version on GitHub: ${latestVersion}`, 'debug');

      if (isNewerVersion(currentVersion, latestVersion)) {
        const asset = release.assets.find(a => a.name.endsWith('.exe') || a.name.includes('Setup'));
        if (asset) {
          const downloadUrl = asset.browser_download_url;
          log(`New update available: Version ${latestVersion}`, 'info');
          showUpdatePrompt(latestVersion, downloadUrl);
        }
      } else {
        log('Application is up to date.', 'info');
      }
    } catch (err) {
      log(`Update check failed: ${err.message}`, 'debug');
    }
  }

  function isNewerVersion(current, latest) {
    const cParts = current.split('.').map(Number);
    const lParts = latest.split('.').map(Number);
    for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
      const c = cParts[i] || 0;
      const l = lParts[i] || 0;
      if (l > c) return true;
      if (c > l) return false;
    }
    return false;
  }

  function showUpdatePrompt(version, downloadUrl) {
    const modal = document.getElementById('modal-update-prompt');
    const verLabel = document.getElementById('update-modal-ver');
    const btnCancel = document.getElementById('btn-cancel-update');
    const btnClose = document.getElementById('btn-close-update-prompt');
    const btnStart = document.getElementById('btn-start-update');
    const progressContainer = document.getElementById('update-progress-container');
    const progressStatus = document.getElementById('update-progress-status');

    verLabel.textContent = `v${version}`;
    modal.style.display = 'flex';
    setTimeout(() => { modal.classList.add('open'); }, 10);

    const closeModal = () => {
      modal.classList.remove('open');
      setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    btnCancel.onclick = closeModal;
    btnClose.onclick = closeModal;

    btnStart.onclick = async () => {
      btnStart.disabled = true;
      btnCancel.disabled = true;
      btnClose.style.display = 'none';
      progressContainer.style.display = 'block';
      progressStatus.textContent = 'Downloading setup files...';

      try {
        log('Starting update download...', 'info');

        const downloadCmd = `
          $downloadUrl = "${downloadUrl}"
          $tempPath = "$env:TEMP\\BC_Elite_QC_Setup.exe"
          try {
              $webClient = New-Object System.Net.WebClient
              $webClient.DownloadFile($downloadUrl, $tempPath)
              if (Test-Path $tempPath) {
                  Start-Process -FilePath $tempPath -Verb RunAs
                  "Success"
              } else {
                  "Download failed: file not created"
              }
          } catch {
              "Error: $_"
          }
        `.trim();

        const result = await electronAPI.getSystemSpec(downloadCmd);
        if (result.success && result.data && result.data.trim() === 'Success') {
          log('Update downloaded successfully. Launching installer...', 'info');
          progressStatus.textContent = 'Launching installer... Closing app.';

          setTimeout(async () => {
            await electronAPI.windowControl('close');
          }, 1500);
        } else {
          const errMsg = result.data ? result.data.trim() : 'Unknown download error';
          throw new Error(errMsg);
        }
      } catch (err) {
        log(`Update failed: ${err.message}`, 'error');
        alert(`Update download failed:\\n${err.message}\\n\\nPlease try again or download manually.`);
        btnStart.disabled = false;
        btnCancel.disabled = false;
        btnClose.style.display = 'block';
        progressContainer.style.display = 'none';
      }
    };
  }

  // Local database helper to persist test runs in LocalStorage
  function saveRecordToHistory(status = 'Passed') {
    const history = JSON.parse(localStorage.getItem('qc_history') || '[]');
    const newRecord = {
      dateTime: new Date().toLocaleString(),
      serialNumber: systemSpecs.serialNumber || 'PC1356548',
      productName: systemSpecs.productName || 'Generic Laptop',
      cpu: systemSpecs.cpu || 'Intel Core',
      ram: systemSpecs.ram || '8 GB',
      ssd: systemSpecs.ssd || '256 GB SSD',
      battery: systemSpecs.battery || 'N/A',
      status: status
    };
    history.unshift(newRecord);
    localStorage.setItem('qc_history', JSON.stringify(history));
  }

  // CSV Generator helper
  function generateCsv(history) {
    const headers = 'Date & Time,Serial Number,Product Name,CPU,RAM,SSD,Battery,Status\n';
    const rows = history.map(r => {
      // Escape commas in CSV fields
      const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;
      return `${escape(r.dateTime)},${escape(r.serialNumber)},${escape(r.productName)},${escape(r.cpu)},${escape(r.ram)},${escape(r.ssd)},${escape(r.battery || 'N/A')},${escape(r.status)}`;
    }).join('\n');
    return headers + rows;
  }

  // =========================================================
  // ACTION WORKFLOW: EXPORT, UPLOAD & BATCH DATABASE QUERY
  // =========================================================

  // 1. DETAILS EXPORT (.TXT File saved on Desktop)
  if (btnDetailsExport) {
    btnDetailsExport.addEventListener('click', async () => {
      log('Preparing hardware profile for export...', 'info');

      if (!systemSpecs.serialNumber) {
        log('No diagnostic data found. Run hardware discovery first.', 'warn');
        showCustomAlert('Please wait for hardware discovery to complete before exporting.', 'Export Error', 'warn');
        return;
      }

      // Format a clean, human-readable structure for the QC report
      const exportContent = `
======================================================================
                  BIZZ CO HUB QUALITY CONTROL REPORT
======================================================================
Date & Time     : ${new Date().toLocaleString()}
Session ID      : ${sessionId}
Product Name    : ${systemSpecs.productName}
Serial Number   : ${systemSpecs.serialNumber}
Operating System: ${systemSpecs.windowsVer}
----------------------------------------------------------------------
SYSTEM HARDWARE SPECIFICATIONS:
----------------------------------------------------------------------
Processor (CPU) : ${systemSpecs.cpu}
System Memory   : ${systemSpecs.ram}
Storage Device  : ${systemSpecs.ssd}
Graphics Card   : ${systemSpecs.graphics}
Screen Display  : ${systemSpecs.displayRes}
Battery Status  : ${systemSpecs.battery}
======================================================================
`;

      const fileName = `QC_Report_${systemSpecs.serialNumber}.txt`;

      // Re-use the existing Tauri Rust Backend command to write desktop file
      const result = await electronAPI.saveTableFile(exportContent, fileName);
      if (result.success) {
        log(`System specs exported successfully to Desktop as: ${fileName}`, 'ready');
        showCustomAlert(`Product specifications saved to Desktop:\n${fileName}`, 'Export Successful', 'success');
      } else {
        log(`Failed to save export file: ${result.error}`, 'error');
        showCustomAlert(`Could not write export file: ${result.error}`, 'Export Failed', 'error');
      }
    });
  }

  // Helper to open specifications upload preview
  function openSpecsUploadPreview() {
    if (!currentOperator) {
      log('Operator authorization is required. Redirecting to Database Portal.', 'warn');
      showCustomAlert('Please authorize your operator account on the Database Portal first.', 'Authorization Required', 'warn');
      const navDbPortal = document.getElementById('nav-database-portal');
      if (navDbPortal) navDbPortal.click();
      return;
    }

    // 1. Brand, Series, Model parsing
    let brand = '';
    let series = '';
    let model = systemSpecs.productName || '';

    const brands = ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI', 'Microsoft', 'Toshiba', 'Samsung', 'Gigabyte', 'Huawei'];
    const matchedBrand = brands.find(b => new RegExp('\\b' + b + '\\b', 'i').test(systemSpecs.productName));
    if (matchedBrand) {
      brand = matchedBrand;
      model = model.replace(new RegExp('\\b' + brand + '\\b', 'ig'), '').trim();
      
      const seriesMap = {
        'HP': ['EliteBook', 'ProBook', 'Pavilion', 'Envy', 'Spectre', 'ZBook', 'Omen', 'Victus', 'Essential', 'Notebook'],
        'Dell': ['Latitude', 'Inspiron', 'XPS', 'Precision', 'Vostro', 'Alienware'],
        'Lenovo': ['ThinkPad', 'IdeaPad', 'Yoga', 'Legion', 'ThinkBook'],
        'Microsoft': ['Surface Laptop', 'Surface Book', 'Surface Pro', 'Surface'],
        'Apple': ['MacBook Pro', 'MacBook Air', 'MacBook']
      };

      const brandSeries = seriesMap[brand] || [];
      const matchedSeries = brandSeries.find(s => new RegExp('\\b' + s + '\\b', 'i').test(model));
      if (matchedSeries) {
        series = matchedSeries;
        model = model.replace(new RegExp('\\b' + series + '\\b', 'ig'), '').trim();
      }
    }

    // 2. CPU Core and Gen parsing
    const cpuStr = systemSpecs.cpu || '';
    let coreVal = '';
    let genVal = '';
    let cpuFull = '';
    const coreMatch = cpuStr.match(/\bi[3579]\b/i);
    if (coreMatch) {
      coreVal = `Intel Core ${coreMatch[0].toLowerCase()}`;
    } else if (/ryzen/i.test(cpuStr)) {
      const ryzenMatch = cpuStr.match(/ryzen\s+[3579]/i);
      coreVal = ryzenMatch ? ryzenMatch[0] : 'AMD Ryzen';
    } else {
      coreVal = cpuStr.split('@')[0].trim();
    }

    const modelMatch = cpuStr.match(/\b(i[3579]-\d{4,5}[a-z]{0,2}|ryzen\s+[3579]\s+\d{4}[a-z]{0,2})\b/i);
    if (modelMatch) {
      cpuFull = modelMatch[0];
    } else {
      const fallbackMatch = cpuStr.match(/([a-z0-9]+-\d+[a-z0-9]*)/i);
      if (fallbackMatch) cpuFull = fallbackMatch[1];
    }

    const genMatch = cpuStr.match(/i[3579]-(\d{1,2})\d{3}/i);
    if (genMatch) {
      const num = parseInt(genMatch[1]);
      let suffix = 'th';
      if (num % 10 === 1 && num % 100 !== 11) suffix = 'st';
      else if (num % 10 === 2 && num % 100 !== 12) suffix = 'nd';
      else if (num % 10 === 3 && num % 100 !== 13) suffix = 'rd';
      genVal = `${num}${suffix} Gen`;
    } else {
      const ryzenGenMatch = cpuStr.match(/ryzen\s+[3579]\s+(\d)\d{3}/i);
      if (ryzenGenMatch) {
        const num = parseInt(ryzenGenMatch[1]);
        genVal = `${num}000 Series`;
      }
    }

    // 3. Display Resolution parsing (e.g. 1920 x 1080 -> 1920 x 1080 (FHD))
    let dispRes = systemSpecs.displayRes || '';
    if (dispRes.includes('1920') && dispRes.includes('1080') && !dispRes.includes('FHD')) {
      dispRes = `${dispRes} ( FHD )`;
    } else if (dispRes.includes('1366') && dispRes.includes('768') && !dispRes.includes('HD')) {
      dispRes = `${dispRes} ( HD )`;
    } else if (dispRes.includes('2560') && dispRes.includes('1440') && !dispRes.includes('QHD')) {
      dispRes = `${dispRes} ( QHD )`;
    } else if (dispRes.includes('3840') && dispRes.includes('2160') && !dispRes.includes('4K UHD')) {
      dispRes = `${dispRes} ( 4K UHD )`;
    }

    // Helper to extract SSD Brand
    function getSsdBrand(model) {
      if (!model) return 'Generic';
      const upperModel = model.toUpperCase();
      if (upperModel.includes('SAMSUNG')) return 'Samsung';
      if (upperModel.includes('CRUCIAL')) return 'Crucial';
      if (upperModel.includes('SANDISK')) return 'SanDisk';
      if (upperModel.includes('KINGSTON')) return 'Kingston';
      if (upperModel.includes('INTEL')) return 'Intel';
      if (upperModel.includes('MICRON')) return 'Micron';
      if (upperModel.includes('KIOXIA')) return 'Kioxia';
      if (upperModel.includes('ADATA')) return 'ADATA';
      if (upperModel.includes('WESTERN DIGITAL') || upperModel.includes('WD ')) return 'WD';
      if (upperModel.includes('SEAGATE')) return 'Seagate';
      if (upperModel.includes('TOSHIBA')) return 'Toshiba';
      if (upperModel.includes('LEXAR')) return 'Lexar';
      if (upperModel.includes('PNY')) return 'PNY';
      
      if (upperModel.startsWith('CT') || upperModel.startsWith('CRUCIAL')) return 'Crucial';
      if (upperModel.startsWith('WD') || upperModel.startsWith('WDC')) return 'WD';
      if (upperModel.startsWith('MZ') || upperModel.startsWith('SAMSUNG')) return 'Samsung';
      if (upperModel.startsWith('KBG') || upperModel.startsWith('KXG')) return 'Kioxia';
      if (upperModel.startsWith('MTFD')) return 'Micron';
      if (upperModel.startsWith('SSDPE') || upperModel.startsWith('MEMPE')) return 'Intel';
      if (upperModel.startsWith('SA2000') || upperModel.startsWith('SKC') || upperModel.startsWith('SNV')) return 'Kingston';
      if (upperModel.startsWith('LNM') || upperModel.startsWith('LNS')) return 'Lexar';

      const firstWord = model.trim().split(/[\s_-]/)[0];
      if (firstWord && firstWord.length > 2 && !/^[A-Z0-9]+$/i.test(firstWord)) {
        return firstWord;
      }
      return 'SSD';
    }

    // 4. RAM Parsing (Brand + Size + Speed)
    let ramVal = '';
    const detailedRam = localStorage.getItem('qc_detailed_ram') || '';
    if (detailedRam) {
      const lines = detailedRam.split('\n').map(s => s.trim()).filter(s => s);
      const slotStrings = [];
      lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length >= 4) {
          const mfg = parts[1] && parts[1].trim() !== 'Unknown' ? parts[1].trim() : 'Generic';
          const cap = parts[2] ? parts[2].trim() : '';
          const spd = parts[3] ? parts[3].trim() : '';
          if (cap) {
            let spdNormalized = spd;
            if (spd && /^\d+$/.test(spd)) {
              spdNormalized = `${spd}MHz`;
            }
            const spdStr = spdNormalized && spdNormalized !== 'Unknown' ? ` (${spdNormalized})` : '';
            slotStrings.push(`${mfg} ${cap}${spdStr}`);
          }
        }
      });
      if (slotStrings.length > 0) {
        ramVal = slotStrings.join(' + ');
      }
    }
    if (!ramVal) ramVal = systemSpecs.ram || '8 GB';

    // 5. SSD & SSD Health parsing from cache (Brand + Size)
    let ssdVal = '';
    let ssdHealthVal = ''; // Left blank for manual entry
    const detailedSsd = localStorage.getItem('qc_detailed_ssd') || '';
    if (detailedSsd) {
      const lines = detailedSsd.split('\n').map(s => s.trim()).filter(s => s);
      const driveStrings = [];
      lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length >= 3) {
          const model = parts[1].trim();
          const size = parts[2].trim();
          const brand = getSsdBrand(model);
          const type = /hdd/i.test(model) || /hdd/i.test(parts[5]) ? 'HDD' : 'SSD';
          if (size) {
            driveStrings.push(`${brand} ${size} ${type}`);
          }
        }
      });
      if (driveStrings.length > 0) {
        ssdVal = driveStrings.join(' + ');
      }
    }
    if (!ssdVal) ssdVal = systemSpecs.ssd || '';

    // Populate inputs
    document.getElementById('preview-inp-product-name').value = systemSpecs.productName || '';
    document.getElementById('preview-inp-brand').value = brand;
    document.getElementById('preview-inp-series').value = series;
    document.getElementById('preview-inp-model').value = model;
    document.getElementById('preview-inp-core').value = cpuFull ? `${coreVal} ( ${cpuFull} )` : coreVal;
    document.getElementById('preview-inp-serial').value = systemSpecs.serialNumber || '';
    document.getElementById('preview-inp-gen').value = genVal;
    document.getElementById('preview-inp-display').value = dispRes;
    document.getElementById('preview-inp-ram').value = ramVal;
    document.getElementById('preview-inp-battery').value = systemSpecs.battery || '';
    document.getElementById('preview-inp-ssd').value = ssdVal;
    document.getElementById('preview-inp-ssd-health').value = ssdHealthVal;
    document.getElementById('preview-inp-graphics').value = systemSpecs.graphics || '';
    document.getElementById('preview-inp-windows').value = systemSpecs.windowsVer || '';
    document.getElementById('preview-inp-remark-parts').selectedIndex = 0;
    document.getElementById('preview-inp-remark-text').value = '';

    const opNameEl = document.getElementById('preview-operator-name');
    const batchContainer = document.getElementById('preview-batch-container');
    const authWarning = document.getElementById('preview-auth-warning');
    const validationError = document.getElementById('preview-validation-error');
    const btnSubmit = document.getElementById('btn-portal-preview-submit');
    const btnUpdate = document.getElementById('btn-portal-preview-update');

    if (validationError) validationError.style.display = 'none';

    if (currentOperator) {
      if (opNameEl) {
        opNameEl.textContent = currentOperator;
        opNameEl.style.color = 'var(--color-green)';
      }
      if (authWarning) authWarning.style.display = 'none';
      if (batchContainer) batchContainer.style.display = 'flex';
      
      const batchInput = document.getElementById('portal-preview-batch-input');
      if (batchInput) batchInput.value = activeBatchCode || '';

      if (btnSubmit) btnSubmit.disabled = false;
      if (btnUpdate) btnUpdate.disabled = false;
    } else {
      if (opNameEl) {
        opNameEl.textContent = 'Not Authorized';
        opNameEl.style.color = 'var(--color-red)';
      }
      if (authWarning) authWarning.style.display = 'block';
      if (batchContainer) batchContainer.style.display = 'none';

      if (btnSubmit) btnSubmit.disabled = true;
      if (btnUpdate) btnUpdate.disabled = true;
    }

    updateConcatenatedProductName();
    openPortalModal('portal-modal-preview');
  }

  // Auto-concatenator function to dynamically build Product Name as components are edited
  function updateConcatenatedProductName() {
    const brand = document.getElementById('preview-inp-brand').value.trim();
    const series = document.getElementById('preview-inp-series').value.trim();
    const model = document.getElementById('preview-inp-model').value.trim();
    const core = document.getElementById('preview-inp-core').value.trim();
    const gen = document.getElementById('preview-inp-gen').value.trim();
    const ram = document.getElementById('preview-inp-ram').value.trim();
    const ssd = document.getElementById('preview-inp-ssd').value.trim();
    const graphics = document.getElementById('preview-inp-graphics').value.trim();
    const display = document.getElementById('preview-inp-display').value.trim();
    const windows = document.getElementById('preview-inp-windows').value.trim();

    let parts = [];
    if (brand) parts.push(brand);
    if (series) parts.push(series);
    if (model) parts.push(model);
    
    let cpuPart = '';
    if (core) {
      cpuPart = core.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    }
    if (gen) cpuPart = cpuPart ? `${cpuPart} - ${gen}` : gen;
    if (cpuPart) parts.push(cpuPart);

    // Helper to sum capacities dynamically (handles multiple items split by "+")
    function sumCapacities(str, defaultVal) {
      if (!str) return defaultVal;
      const matches = str.match(/(\d+(?:\.\d+)?)\s*(GB|TB)/ig);
      if (!matches) return defaultVal;
      
      let totalGb = 0;
      matches.forEach(m => {
        const numMatch = m.match(/(\d+(?:\.\d+)?)/);
        const unitMatch = m.match(/(GB|TB)/i);
        if (numMatch && unitMatch) {
          const val = parseFloat(numMatch[1]);
          const unit = unitMatch[1].toUpperCase();
          if (unit === 'TB') {
            totalGb += val * 1024;
          } else {
            totalGb += val;
          }
        }
      });
      if (totalGb === 0) return defaultVal;
      if (totalGb >= 950) {
        return `${Math.round(totalGb / 1024 * 10) / 10}TB`;
      } else {
        return `${Math.round(totalGb)}GB`;
      }
    }

    let ramClean = sumCapacities(ram, '8GB');
    let ssdSize = sumCapacities(ssd, '256GB');

    if (ssdSize) {
      const hasSsd = /ssd/i.test(ssd);
      const hasHdd = /hdd/i.test(ssd);
      let typeLabel = 'SSD';
      if (hasSsd && hasHdd) {
        typeLabel = 'SSD+HDD';
      } else if (hasHdd) {
        typeLabel = 'HDD';
      }
      if (!new RegExp('\\b' + typeLabel + '\\b', 'i').test(ssdSize)) {
        ssdSize = `${ssdSize} ${typeLabel}`;
      }
    }

    let storagePart = '';
    if (ramClean) storagePart = ramClean;
    if (ssdSize) storagePart = storagePart ? `${storagePart}/ ${ssdSize}` : ssdSize;
    if (storagePart) parts.push(storagePart);

    if (graphics) {
      const vramMatch = graphics.match(/\(\s*(\d+\s*GB)\s*\)/i);
      let gpuLabel = vramMatch ? `${vramMatch[1].replace(/\s/g, '')} Graphics` : 'Graphics';
      parts.push(`with ${gpuLabel}`);
    }

    if (display) {
      const resMatch = display.match(/\(\s*([^)]+)\s*\)/i);
      let dispLabel = resMatch ? `${resMatch[1].trim()} Display` : 'Display';
      parts.push(dispLabel);
    }

    if (windows) {
      const winClean = windows.replace(/\s*\(Build\s*\d+\)/i, '').trim();
      parts.push(winClean);
    }

    const fullName = parts.join(' ');
    document.getElementById('preview-inp-product-name').value = fullName;
  }

  // Bind change/input listeners to perform auto-concatenation
  ['preview-inp-brand', 'preview-inp-series', 'preview-inp-model', 'preview-inp-core', 'preview-inp-gen', 'preview-inp-ram', 'preview-inp-ssd', 'preview-inp-graphics', 'preview-inp-display', 'preview-inp-windows'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateConcatenatedProductName);
    }
  });

  // Helper to ensure SSD health is formatted as a percentage (supports multiple values joined by "+")
  function formatSsdHealthPercentage(val) {
    const trimmed = val ? val.trim() : '';
    if (!trimmed) return '';
    const parts = trimmed.split('+');
    const formattedParts = parts.map(part => {
      const pTrim = part.trim();
      const digits = pTrim.replace(/[^\d]/g, '');
      if (digits) {
        return `${digits}%`;
      }
      return pTrim;
    });
    return formattedParts.join(' + ');
  }

  // Bind preview go-to-auth redirect link
  const previewGoToAuth = document.getElementById('preview-go-to-auth');
  if (previewGoToAuth) {
    previewGoToAuth.addEventListener('click', (e) => {
      e.preventDefault();
      closePortalModal('portal-modal-preview');
      const navDbPortal = document.getElementById('nav-database-portal');
      if (navDbPortal) {
        navDbPortal.style.display = 'flex';
        navDbPortal.click();
      }
    });
  }

  // Bind Clear button
  const btnPortalPreviewClear = document.getElementById('btn-portal-preview-clear');
  if (btnPortalPreviewClear) {
    btnPortalPreviewClear.addEventListener('click', () => {
      document.getElementById('preview-inp-product-name').value = '';
      document.getElementById('preview-inp-brand').value = '';
      document.getElementById('preview-inp-series').value = '';
      document.getElementById('preview-inp-model').value = '';
      document.getElementById('preview-inp-core').value = '';
      document.getElementById('preview-inp-serial').value = '';
      document.getElementById('preview-inp-gen').value = '';
      document.getElementById('preview-inp-display').value = '';
      document.getElementById('preview-inp-ram').value = '';
      document.getElementById('preview-inp-battery').value = '';
      document.getElementById('preview-inp-ssd').value = '';
      document.getElementById('preview-inp-ssd-health').value = '';
      document.getElementById('preview-inp-graphics').value = '';
      document.getElementById('preview-inp-windows').value = '';
      document.getElementById('preview-inp-remark-parts').selectedIndex = 0;
      document.getElementById('preview-inp-remark-text').value = '';
      log('Cleared all spec preview fields.', 'info');
    });
  }

  // Bind Update button (posts to update-by-serial API)
  const btnPortalPreviewUpdate = document.getElementById('btn-portal-preview-update');
  if (btnPortalPreviewUpdate) {
    btnPortalPreviewUpdate.addEventListener('click', async () => {
      if (!currentOperator) return;

      const batchInput = document.getElementById('portal-preview-batch-input');
      const code = batchInput ? batchInput.value.trim() : '';
      if (!code) {
        const valErr = document.getElementById('preview-validation-error');
        const valErrText = document.getElementById('preview-validation-error-text');
        if (valErrText) valErrText.textContent = 'Batch code is required for update.';
        if (valErr) valErr.style.display = 'block';
        return;
      }

      activeBatchCode = code;
      const pageActiveBatch = document.getElementById('page-portal-active-batch');
      if (pageActiveBatch) pageActiveBatch.textContent = activeBatchCode;

      const specPayload = {
        productName: document.getElementById('preview-inp-product-name').value.trim(),
        serialNumber: document.getElementById('preview-inp-serial').value.trim(),
        cpu: document.getElementById('preview-inp-core').value.trim(),
        ram: document.getElementById('preview-inp-ram').value.trim(),
        ssd: document.getElementById('preview-inp-ssd').value.trim(),
        graphics: document.getElementById('preview-inp-graphics').value.trim(),
        displayRes: document.getElementById('preview-inp-display').value.trim(),
        battery: document.getElementById('preview-inp-battery').value.trim(),
        windowsVer: document.getElementById('preview-inp-windows').value.trim(),
        brand: document.getElementById('preview-inp-brand').value.trim(),
        series: document.getElementById('preview-inp-series').value.trim(),
        model: document.getElementById('preview-inp-model').value.trim(),
        gen: document.getElementById('preview-inp-gen').value.trim(),
        ssdHealth: formatSsdHealthPercentage(document.getElementById('preview-inp-ssd-health').value),
        partsIssues: document.getElementById('preview-inp-remark-parts').value,
        issues: document.getElementById('preview-inp-remark-text').value.trim()
      };

      btnPortalPreviewUpdate.disabled = true;
      const originalText = btnPortalPreviewUpdate.innerHTML;
      btnPortalPreviewUpdate.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating...`;

      const payload = {
        serialNumber: specPayload.serialNumber,
        updatedSpecs: {
          ...specPayload,
          operator: currentOperator
        },
        batchCode: activeBatchCode
      };

      try {
        const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
        const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';

        const result = await electronAPI.httpPost(`${apiUrl}/update-by-serial`, payload, token);
        if (result && result.success && result.data && result.data.success) {
          log(`Updated specifications under batch: ${activeBatchCode}`, 'ready');
          showCustomAlert('Device diagnostics successfully updated.', 'Success', 'success');
          
          if (portalCurrentBatch && portalCurrentBatch.toLowerCase() === activeBatchCode.toLowerCase()) {
            fetchPortalRecords(portalCurrentBatch);
          }
          await loadPortalBatches();
          closePortalModal('portal-modal-preview');
        } else {
          const errMsg = (result && result.data && result.data.error) ? result.data.error : 'Failed to save changes.';
          throw new Error(errMsg);
        }
      } catch (err) {
        log(`Database update failure: ${err.message || err}`, 'error');
        showCustomAlert(`Update Failure: ${err.message || err}`, 'Update Failure', 'error');
      } finally {
        btnPortalPreviewUpdate.disabled = false;
        btnPortalPreviewUpdate.innerHTML = originalText;
      }
    });
  }

  // Bind Submit button (posts to upload-details API)
  const btnPortalPreviewSubmit = document.getElementById('btn-portal-preview-submit');
  if (btnPortalPreviewSubmit) {
    btnPortalPreviewSubmit.addEventListener('click', async () => {
      if (!currentOperator) return;

      const batchInput = document.getElementById('portal-preview-batch-input');
      const code = batchInput ? batchInput.value.trim() : '';
      if (!code) {
        const valErr = document.getElementById('preview-validation-error');
        const valErrText = document.getElementById('preview-validation-error-text');
        if (valErrText) valErrText.textContent = 'Batch code is required for upload.';
        if (valErr) valErr.style.display = 'block';
        return;
      }

      activeBatchCode = code;
      const pageActiveBatch = document.getElementById('page-portal-active-batch');
      if (pageActiveBatch) pageActiveBatch.textContent = activeBatchCode;

      const specPayload = {
        productName: document.getElementById('preview-inp-product-name').value.trim(),
        serialNumber: document.getElementById('preview-inp-serial').value.trim(),
        cpu: document.getElementById('preview-inp-core').value.trim(),
        ram: document.getElementById('preview-inp-ram').value.trim(),
        ssd: document.getElementById('preview-inp-ssd').value.trim(),
        graphics: document.getElementById('preview-inp-graphics').value.trim(),
        displayRes: document.getElementById('preview-inp-display').value.trim(),
        battery: document.getElementById('preview-inp-battery').value.trim(),
        windowsVer: document.getElementById('preview-inp-windows').value.trim(),
        brand: document.getElementById('preview-inp-brand').value.trim(),
        series: document.getElementById('preview-inp-series').value.trim(),
        model: document.getElementById('preview-inp-model').value.trim(),
        gen: document.getElementById('preview-inp-gen').value.trim(),
        ssdHealth: formatSsdHealthPercentage(document.getElementById('preview-inp-ssd-health').value),
        partsIssues: document.getElementById('preview-inp-remark-parts').value,
        issues: document.getElementById('preview-inp-remark-text').value.trim()
      };

      btnPortalPreviewSubmit.disabled = true;
      const originalText = btnPortalPreviewSubmit.innerHTML;
      btnPortalPreviewSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

      const payload = {
        batchCode: activeBatchCode,
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        operator: currentOperator,
        specs: {
          ...specPayload,
          operator: currentOperator
        }
      };

      try {
        const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
        const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';

        const result = await electronAPI.httpPost(`${apiUrl}/upload-details`, payload, token);
        if (result.success) {
          log(`Uploaded specifications under batch: ${activeBatchCode}`, 'ready');
          showCustomAlert(`Product specifications successfully logged under Batch: ${activeBatchCode}`, 'Upload Success', 'success');
          saveRecordToHistory(`Uploaded to ${activeBatchCode} (by ${currentOperator})`);
          
          if (portalCurrentBatch && portalCurrentBatch.toLowerCase() === activeBatchCode.toLowerCase()) {
            fetchPortalRecords(portalCurrentBatch);
          }
          await loadPortalBatches();
          closePortalModal('portal-modal-preview');
        } else {
          throw new Error(result.error || 'Server error');
        }
      } catch (err) {
        log(`Database upload failure: ${err.message || err}`, 'error');
        let cleanErrMsg = err.message || String(err);
        showCustomAlert(`Sync Failure: ${cleanErrMsg}`, 'Sync Failure', 'error');
      } finally {
        btnPortalPreviewSubmit.disabled = false;
        btnPortalPreviewSubmit.innerHTML = originalText;
      }
    });
  }

  // Keydown support for batch code input in preview
  const previewBatchInput = document.getElementById('portal-preview-batch-input');
  if (previewBatchInput) {
    previewBatchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('btn-portal-preview-submit')?.click();
      }
    });
  }

  // 2. DETAILS UPLOAD (Opens login portal and controls database operations)
  if (btnDetailsUpload) {
    btnDetailsUpload.addEventListener('click', () => {
      if (!systemSpecs.serialNumber) {
        log('Diagnostics must be completed before database upload.', 'warn');
        showCustomAlert('Please wait for hardware detection to populate metrics before uploading.', 'Upload Interrupted', 'warn');
        return;
      }

      openSpecsUploadPreview();
    });
  }

  // CLOSE PORTAL MODAL
  if (btnClosePortalModal) {
    btnClosePortalModal.addEventListener('click', () => {
      uploadPortalModal.classList.remove('open');
      setTimeout(() => { uploadPortalModal.style.display = 'none'; }, 300);
    });
  }

  // PORTAL LOGIN ACTION
  if (btnPortalLogin) {
    btnPortalLogin.addEventListener('click', async () => {
      const username = portalUsernameInput.value.trim();
      const password = portalPasswordInput.value.trim();

      if (!username || !password) {
        portalLoginError.textContent = 'Username and password are required.';
        portalLoginError.style.display = 'block';
        return;
      }

      btnPortalLogin.disabled = true;
      const originalText = btnPortalLogin.innerHTML;
      btnPortalLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
      portalLoginError.style.display = 'none';

      const rememberCheckbox = document.getElementById('portal-remember');
      const isRemember = rememberCheckbox ? rememberCheckbox.checked : false;

      try {
        const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
        const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';

        const response = await electronAPI.httpPost(`${apiUrl}/qc/auth`, { username, password }, token);

        if (response.success && response.data && response.data.success) {
          currentOperator = response.data.operator;
          portalLoggedUser.textContent = currentOperator;
          portalLoginSection.style.display = 'none';
          portalDashboardSection.style.display = 'flex';
          portalLoginError.style.display = 'none';
          log(`QC Operator Session Authorized: "${currentOperator}"`, 'ready');
          saveOperatorRememberCredentials(username, password, isRemember);
        } else {
          // Fallback to local admin check in case of API offline / not configured
          const isLocalValid = (username.toLowerCase() === 'admin' || username.toLowerCase() === 'operator') && password === 'password';
          if (isLocalValid) {
            currentOperator = username;
            portalLoggedUser.textContent = currentOperator;
            portalLoginSection.style.display = 'none';
            portalDashboardSection.style.display = 'flex';
            portalLoginError.style.display = 'none';
            log(`QC Operator Session Authorized via Local Fallback: "${currentOperator}"`, 'ready');
            saveOperatorRememberCredentials(username, password, isRemember);
          } else {
            const errMsg = response.data?.error || response.error || 'Invalid credentials.';
            portalLoginError.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${errMsg}`;
            portalLoginError.style.display = 'block';
          }
        }
      } catch (err) {
        // Fallback to local admin check
        const isLocalValid = (username.toLowerCase() === 'admin' || username.toLowerCase() === 'operator') && password === 'password';
        if (isLocalValid) {
          currentOperator = username;
          portalLoggedUser.textContent = currentOperator;
          portalLoginSection.style.display = 'none';
          portalDashboardSection.style.display = 'flex';
          portalLoginError.style.display = 'none';
          log(`QC Operator Session Authorized via Local Fallback: "${currentOperator}"`, 'ready');
          saveOperatorRememberCredentials(username, password, isRemember);
        } else {
          portalLoginError.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Authentication error: ${err.message || err}`;
          portalLoginError.style.display = 'block';
        }
      } finally {
        btnPortalLogin.disabled = false;
        btnPortalLogin.innerHTML = originalText;
      }
    });
  }

  // PORTAL LOGOUT ACTION
  if (btnPortalLogout) {
    btnPortalLogout.addEventListener('click', () => {
      log(`Operator "${currentOperator}" signed out.`, 'info');
      currentOperator = '';
      portalLoginSection.style.display = 'flex';
      portalDashboardSection.style.display = 'none';
      portalUsernameInput.value = '';
      portalPasswordInput.value = '';
      portalLoginError.style.display = 'none';
    });
  }

  // PORTAL CREATE BATCH ACTION
  if (btnPortalCreateBatch) {
    btnPortalCreateBatch.addEventListener('click', async () => {
      const batchCode = prompt("Enter Batch Code to create and assign:");
      if (batchCode === null) {
        log('Batch creation aborted by operator.', 'info');
        return;
      }

      const cleanBatchCode = batchCode.trim();
      if (!cleanBatchCode) {
        log('Validation error: A valid Batch Code is required.', 'warn');
        showCustomAlert('A valid Batch Code must be provided.', 'Validation Error', 'warn');
        return;
      }

      log(`Registering batch "${cleanBatchCode}" in database...`, 'info');
      btnPortalCreateBatch.disabled = true;
      const originalBtnText = btnPortalCreateBatch.innerHTML;
      btnPortalCreateBatch.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating...`;

      try {
        const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
        const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';

        const payload = {
          batchCode: cleanBatchCode,
          operator: currentOperator,
          sessionId: sessionId,
          createdAt: new Date().toISOString()
        };

        const result = await electronAPI.httpPost(`${apiUrl}/create-batch`, payload, token);

        if (result.success) {
          activeBatchCode = cleanBatchCode;

          // Sync batch label on the page portal too
          const pageActiveBatch = document.getElementById('page-portal-active-batch');
          if (pageActiveBatch) pageActiveBatch.textContent = activeBatchCode;

          log(`Batch "${activeBatchCode}" registered in database successfully.`, 'ready');
          showCustomAlert(`Batch "${activeBatchCode}" has been created and recorded in the database.`, 'Batch Created', 'success');

          // Close portal modal
          uploadPortalModal.classList.remove('open');
          setTimeout(() => { uploadPortalModal.style.display = 'none'; }, 300);
        } else {
          let errMsg = result.error || 'Server rejected the batch creation request.';
          const httpErrMatch = errMsg.match(/HTTP \d+:\s*(\{.*\})/i);
          if (httpErrMatch) {
            try {
              const errObj = JSON.parse(httpErrMatch[1]);
              if (errObj.error) errMsg = errObj.error;
            } catch (e) { /* fallback */ }
          }
          log(`Batch creation failed: ${errMsg}`, 'error');
          showCustomAlert(`Failed to create batch: ${errMsg}`, 'Batch Error', 'error');
        }
      } catch (err) {
        log(`Batch API unreachable, falling back to local assignment: ${err.message || err}`, 'warn');
        activeBatchCode = cleanBatchCode;
        const pageActiveBatch = document.getElementById('page-portal-active-batch');
        if (pageActiveBatch) pageActiveBatch.textContent = activeBatchCode;
        showCustomAlert(
          `Database unreachable. Batch "${activeBatchCode}" is set locally for this session only.`,
          'Offline Mode',
          'warn'
        );
      } finally {
        btnPortalCreateBatch.disabled = false;
        btnPortalCreateBatch.innerHTML = originalBtnText;
      }
    });
  }

  // PORTAL VIEW HISTORY ACTION (Reuses our lookup table modal)
  if (btnPortalViewHistory) {
    btnPortalViewHistory.addEventListener('click', () => {
      // Close portal modal
      uploadPortalModal.classList.remove('open');
      setTimeout(() => { uploadPortalModal.style.display = 'none'; }, 300);

      // Open database batch search lookup modal
      if (btnViewUploadTable) {
        btnViewUploadTable.click();
      }
    });
  }

  // PORTAL UPDATE DETAILS ACTION (Triggers discovery refresh)
  if (btnPortalUpdateDetails) {
    btnPortalUpdateDetails.addEventListener('click', async () => {
      btnPortalUpdateDetails.disabled = true;
      const originalText = btnPortalUpdateDetails.innerHTML;
      btnPortalUpdateDetails.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...`;

      log('Re-running diagnostic discovery to update system specs...', 'info');
      await fetchAllSpecs(true);

      btnPortalUpdateDetails.disabled = false;
      btnPortalUpdateDetails.innerHTML = originalText;
      showCustomAlert('Diagnostic configurations and system hardware details successfully updated.', 'Details Refreshed', 'success');
    });
  }

  // PORTAL EXPORT EXCEL ACTION (CSV formatted for Excel saved on Desktop)
  if (btnPortalExportExcel) {
    btnPortalExportExcel.addEventListener('click', async () => {
      log('Preparing Excel compatible data dump...', 'info');

      // Export history log if populated, otherwise export current profile run
      const history = JSON.parse(localStorage.getItem('qc_history') || '[]');
      let csvData = '';
      
      if (history.length > 0) {
        const headers = 'Date & Time,Serial Number,Product Name,CPU,RAM,SSD,Battery,Status\n';
        const rows = history.map(r => {
          const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;
          return `${escape(r.dateTime)},${escape(r.serialNumber)},${escape(r.productName)},${escape(r.cpu)},${escape(r.ram)},${escape(r.ssd)},${escape(r.battery || 'N/A')},${escape(r.status)}`;
        }).join('\n');
        csvData = headers + rows;
      } else {
        const headers = 'Date & Time,Serial Number,Product Name,CPU,RAM,SSD,Battery,Operating System,Operator\n';
        const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;
        csvData = headers + `${escape(new Date().toLocaleString())},${escape(systemSpecs.serialNumber)},${escape(systemSpecs.productName)},${escape(systemSpecs.cpu)},${escape(systemSpecs.ram)},${escape(systemSpecs.ssd)},${escape(systemSpecs.battery)},${escape(systemSpecs.windowsVer)},${escape(currentOperator || 'N/A')}`;
      }

      const fileName = `QC_Diagnostics_Report_${systemSpecs.serialNumber || 'Report'}.csv`;

      const result = await electronAPI.saveTableFile(csvData, fileName);
      if (result.success) {
        log(`Diagnostic record logs exported to Desktop: ${fileName}`, 'ready');
        showCustomAlert(`Report exported successfully to Desktop:\n${fileName}`, 'Export Successful', 'success');
      } else {
        log(`Failed to write export file: ${result.error}`, 'error');
        showCustomAlert(`Could not write Excel report: ${result.error}`, 'Export Failed', 'error');
      }
    });
  }

  // PORTAL EXPORT PDF ACTION (Opens print dialog on formatted template)
  if (btnPortalExportPdf) {
    btnPortalExportPdf.addEventListener('click', () => {
      log('Spawning printed document thread for PDF generation...', 'info');
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
          <head>
            <title>BIZZ CO HUB - QC REPORT</title>
            <style>
              body { font-family: -apple-system, sans-serif; color: #333; padding: 45px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #007aff; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 24px; color: #007aff; text-transform: uppercase; }
              .header p { margin: 5px 0 0 0; color: #666; font-size: 13px; letter-spacing: 0.5px; }
              .section-title { font-size: 15px; font-weight: 700; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-top: 35px; margin-bottom: 15px; text-transform: uppercase; color: #007aff; }
              .row { display: flex; justify-content: space-between; border-bottom: 1px solid #f9f9f9; padding: 8px 0; font-size: 13px; }
              .label { font-weight: 600; color: #555; }
              .val { color: #111; font-family: monospace; font-size: 13.5px; }
              .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>BIZZ CO HUB QUALITY CONTROL REPORT</h1>
              <p>Hardware Specification Diagnostics Summary</p>
            </div>
            <div class="row"><span class="label">Date & Time</span><span class="val">\${new Date().toLocaleString()}</span></div>
            <div class="row"><span class="label">Session ID</span><span class="val">\${sessionId}</span></div>
            <div class="row"><span class="label">Operator Signature</span><span class="val">\${currentOperator || 'N/A'}</span></div>
            <div class="row"><span class="label">Serial Number</span><span class="val">\${systemSpecs.serialNumber || 'N/A'}</span></div>
            <div class="row"><span class="label">Product Model</span><span class="val">\${systemSpecs.productName || 'N/A'}</span></div>
            
            <div class="section-title">Hardware Configuration Profiles</div>
            <div class="row"><span class="label">Processor (CPU)</span><span class="val">\${systemSpecs.cpu || 'N/A'}</span></div>
            <div class="row"><span class="label">System Memory (RAM)</span><span class="val">\${systemSpecs.ram || 'N/A'}</span></div>
            <div class="row"><span class="label">Primary Storage</span><span class="val">\${systemSpecs.ssd || 'N/A'}</span></div>
            <div class="row"><span class="label">Graphics Adapter</span><span class="val">\${systemSpecs.graphics || 'N/A'}</span></div>
            <div class="row"><span class="label">Display Resolution</span><span class="val">\${systemSpecs.displayRes || 'N/A'}</span></div>
            <div class="row"><span class="label">Battery Health Condition</span><span class="val">\${systemSpecs.battery || 'N/A'}</span></div>
            <div class="row"><span class="label">Operating System</span><span class="val">\${systemSpecs.windowsVer || 'N/A'}</span></div>
            
            <div class="footer">
              &copy; \${new Date().getFullYear()} Bizz Co Hub LLC. Automatically generated Quality Check certificate.
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
        log('Print dialog initiated successfully for PDF generation.', 'ready');
      } else {
        log('PDF export aborted: Browser print window was blocked.', 'warn');
        showCustomAlert('Popup window blocked. Please permit popups for this application to print reports.', 'Export Blocked', 'warn');
      }
    });
  }

  // 3. VIEW UPLOAD TABLE (Open, Close and Query Remote Database)
  if (btnViewUploadTable) {
    btnViewUploadTable.addEventListener('click', () => {
      uploadTableModal.style.display = 'flex';
      setTimeout(() => { uploadTableModal.classList.add('open'); }, 10);
      inputSearchBatchCode.value = '';
      uploadTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
            Enter a Batch Code above to query records from the central database.
          </td>
        </tr>
      `;
    });
  }

  if (btnCloseUploadModal) {
    btnCloseUploadModal.addEventListener('click', () => {
      uploadTableModal.classList.remove('open');
      setTimeout(() => { uploadTableModal.style.display = 'none'; }, 300);
    });
  }

  // Listen for Enter key on Batch input field
  if (inputSearchBatchCode) {
    inputSearchBatchCode.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        btnSearchBatch.click();
      }
    });
  }

  if (btnSearchBatch) {
    btnSearchBatch.addEventListener('click', async () => {
      const batchCodeQuery = inputSearchBatchCode.value.trim();
      if (!batchCodeQuery) {
        uploadTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-orange); padding: 20px;">Please enter a batch code to query.</td></tr>`;
        return;
      }

      log(`Searching database for Batch Code: "${batchCodeQuery}"...`, 'info');
      uploadTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 30px;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: var(--color-blue); margin-bottom: 10px;"></i>
            <div>Querying records... please wait.</div>
          </td>
        </tr>
      `;

      try {
        const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
        const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';
        const result = await electronAPI.httpGet(`${apiUrl}/get-details?batchCode=${encodeURIComponent(batchCodeQuery)}`, token);

        if (!result.success) {
          throw new Error(result.error || 'Server returned an error');
        }

        const databaseRecords = result.data;

        if (!Array.isArray(databaseRecords) || databaseRecords.length === 0) {
          uploadTableBody.innerHTML = `
            <tr>
              <td colspan="7" style="text-align: center; color: var(--color-orange); padding: 30px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 24px; margin-bottom: 10px;"></i>
                <div>No matched system profiles logged under batch: "${batchCodeQuery}"</div>
              </td>
            </tr>
          `;
          return;
        }

        // Render records inside table body dynamically
        uploadTableBody.innerHTML = '';
        databaseRecords.forEach(record => {
          const s = record.specs || {};
          const tr = document.createElement('tr');
          
          const dateStr = record.timestamp ? new Date(record.timestamp).toLocaleDateString() : 'N/A';
          const operator = record.specs?.operator || record.batchCode || 'N/A';
          
          tr.innerHTML = `
            <td><strong>${dateStr}</strong></td>
            <td><code>${s.serialNumber || 'N/A'}</code></td>
            <td>${s.productName || 'N/A'}</td>
            <td title="${s.cpu || 'N/A'}">${s.cpu ? (s.cpu.length > 20 ? s.cpu.slice(0, 20) + '...' : s.cpu) : 'N/A'}</td>
            <td>${s.ram || 'N/A'}</td>
            <td>${s.ssd || 'N/A'}</td>
            <td><span style="font-weight: 600;">${s.battery || 'N/A'}</span></td>
          `;
          uploadTableBody.appendChild(tr);
        });

        log(`Successfully loaded ${databaseRecords.length} system profiles for Batch: ${batchCodeQuery}`, 'ready');

      } catch (err) {
        log(`Failed to retrieve database contents: ${err.message}`, 'error');
        uploadTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--color-red); padding: 30px;">
              <i class="fa-solid fa-circle-xmark" style="font-size: 24px; margin-bottom: 10px;"></i>
              <div>Failed to query server: ${err.message}</div>
            </td>
          </tr>
        `;
      }
    });
  }

  // Modal events
  btnCloseModal.addEventListener('click', () => {
    modalOverlay.classList.remove('open');
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('open');
    }
  });

  btnModalRefresh.addEventListener('click', () => {
    populateTableModal();
    log('Diagnostic records table refreshed.', 'debug');
  });

  btnModalClear.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all local diagnostic records?')) {
      localStorage.setItem('qc_history', '[]');
      populateTableModal();
      log('Database cleared.', 'warn');
    }
  });

  function populateTableModal() {
    const history = JSON.parse(localStorage.getItem('qc_history') || '[]');
    tableBody.innerHTML = '';

    if (history.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No records found. Run diagnostics to populate.</td></tr>`;
      return;
    }

    history.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.dateTime}</td>
        <td>${r.serialNumber}</td>
        <td>${r.productName}</td>
        <td title="${r.cpu}">${r.cpu.length > 25 ? r.cpu.substring(0, 25) + '...' : r.cpu}</td>
        <td>${r.ram}</td>
        <td title="${r.ssd}">${r.ssd.length > 25 ? r.ssd.substring(0, 25) + '...' : r.ssd}</td>
        <td>${r.battery || 'N/A'}</td>
        <td><span class="test-status status-success" style="background-color: ${r.status === 'Initialized' ? 'rgba(75, 123, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; color: ${r.status === 'Initialized' ? 'var(--color-blue)' : 'var(--color-green)'};">${r.status}</span></td>
      `;
      tableBody.appendChild(tr);
    });
  }



  // INDIVIDUAL COMPONENT DIAGNOSTICS TESTS

  async function executeTest(btnElement, fileName, folderName, displayName) {
    const statusBadge = btnElement.querySelector('.test-status');

    log(`Launching diagnostic module: ${displayName}...`, 'info');
    statusBadge.textContent = 'Running';
    statusBadge.className = 'test-status status-running';

    try {
      // Check if file exists first
      const exists = await electronAPI.checkToolExists(fileName, folderName);
      if (!exists) {
        log(`Executable missing: ${fileName} not found in ${folderName} directory.`, 'error');
        statusBadge.textContent = 'Missing';
        statusBadge.className = 'test-status status-error';
        return false;
      }

      const result = await electronAPI.launchTool(fileName, folderName);
      if (result.success) {
        log(`Module completed: ${displayName} has shut down.`, 'debug');
        statusBadge.textContent = 'Passed';
        statusBadge.className = 'test-status status-success';
        saveRecordToHistory(`${displayName} Checked`);
        return true;
      } else {
        log(`Failed execution on ${displayName}: ${result.error}`, 'error');
        statusBadge.textContent = 'Failed';
        statusBadge.className = 'test-status status-error';
        return false;
      }
    } catch (err) {
      log(`Exception in testing thread (${displayName}): ${err.message}`, 'error');
      statusBadge.textContent = 'Error';
      statusBadge.className = 'test-status status-error';
      return false;
    }
  }

  // Bind single clicks
  testHdSentinel.addEventListener('click', () => executeTest(testHdSentinel, 'HDSentinel.exe', 'HDSentinel', 'HD Sentinel'));
  testLcd.addEventListener('click', () => executeTest(testLcd, 'LCD_checking.exe', 'LCD_checking', 'LCD Pixel Check'));
  testCpuz.addEventListener('click', () => executeTest(testCpuz, 'cpuz_x64.exe', 'cpuz', 'CPU-Z Info'));
  testBattery.addEventListener('click', () => executeTest(testBattery, 'Battery_checking.exe', 'Battery_checking', 'Battery Diagnostics'));
  testKeyboard.addEventListener('click', () => executeTest(testKeyboard, 'Keyboard_checking.exe', 'Keyboard_checking', 'Keyboard matrix check'));
  testSound.addEventListener('click', () => executeTest(testSound, 'Sound_checking.mp4', 'Sound_checking', 'Audio Playback'));

  // AUTO RUN ALL
  async function runAllTests() {
    log('Starting full automated diagnostics sequence...', 'info');
    log('Checking diagnostic tools integrity...', 'debug');

    // Launch all executables in parallel, matching the batch file behaviour
    const tests = [
      { element: testHdSentinel, file: 'HDSentinel.exe', folder: 'HDSentinel', name: 'HD Sentinel' },
      { element: testLcd, file: 'LCD_checking.exe', folder: 'LCD_checking', name: 'LCD Pixel Check' },
      { element: testCpuz, file: 'cpuz_x64.exe', folder: 'cpuz', name: 'CPU-Z Info' },
      { element: testBattery, file: 'Battery_checking.exe', folder: 'Battery_checking', name: 'Battery Diagnostics' },
      { element: testKeyboard, file: 'Keyboard_checking.exe', folder: 'Keyboard_checking', name: 'Keyboard matrix check' },
      { element: testSound, file: 'Sound_checking.mp4', folder: 'Sound_checking', name: 'Audio Playback' }
    ];

    // Execute all parallel tests
    const testPromises = tests.map(t => executeTest(t.element, t.file, t.folder, t.name));

    // Also run OS Native System Utilities, just like in BizzCoHub QC File.bat
    log('Invoking system administration interfaces...', 'info');

    // Windows Camera
    electronAPI.launchSystemTool('start microsoft.windows.camera:').then(res => {
      if (res.success) log('Native camera interface opened.', 'debug');
    });

    // Sounds Control Panel
    electronAPI.launchSystemTool('start control mmsys.cpl sounds').then(res => {
      if (res.success) log('System sound settings panel opened.', 'debug');
    });

    // DirectX Diagnostics
    electronAPI.launchSystemTool('start dxdiag').then(res => {
      if (res.success) log('DirectX hardware diagnostic window opened.', 'debug');
    });

    // Disk Management
    electronAPI.launchSystemTool('start diskmgmt.msc').then(res => {
      if (res.success) log('Disk partition manager opened.', 'debug');
    });

    // Screen Resolution Control Panel
    electronAPI.launchSystemTool('start desk.cpl ,,5').then(res => {
      if (res.success) log('Display settings panel opened.', 'debug');
    });

    // Wait for all checkers to complete
    await Promise.all(testPromises);

    log('All processes initiated successfully.', 'ready');
    saveRecordToHistory('Auto Check Run');
  }

  btnAutoRun.addEventListener('click', runAllTests);
  if (btnGlobalCheck) btnGlobalCheck.addEventListener('click', runAllTests);

  // SIDEBAR NAVIGATION ACTION (actual view switching)
  const navLinks = document.querySelectorAll('.nav-item');
  const appViews = document.querySelectorAll('.app-view');

  navLinks.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove active class from all nav items
      navLinks.forEach(nav => nav.classList.remove('active'));

      // Add active class to clicked item
      item.classList.add('active');

      // Determine which view to show
      let targetViewId = 'view-system-health';
      if (item.id === 'nav-ram-details') targetViewId = 'view-ram-details';
      else if (item.id === 'nav-ssd-details') targetViewId = 'view-ssd-details';
      else if (item.id === 'nav-graphics-details') targetViewId = 'view-graphics-details';
      else if (item.id === 'nav-battery-details') targetViewId = 'view-battery-details';
      else if (item.id === 'nav-console-details') targetViewId = 'view-console-details';
      else if (item.id === 'nav-settings-details') targetViewId = 'view-settings-details';
      else if (item.id === 'nav-support-details') targetViewId = 'view-support-details';
      else if (item.id === 'nav-update-check') targetViewId = 'view-update-check';
      else if (item.id === 'nav-database-portal') targetViewId = 'view-database-portal';

      // Hide all views and show target view
      appViews.forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none';
      });

      const targetView = document.getElementById(targetViewId);
      if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'flex';
      }

      const serviceName = item.querySelector('span').textContent;
      log(`Navigated to: ${serviceName}`, 'debug');

      // Load corresponding detailed specifications
      if (targetViewId === 'view-ram-details') loadDetailedRAM(false);
      else if (targetViewId === 'view-ssd-details') loadDetailedSSD(false);
      else if (targetViewId === 'view-graphics-details') loadDetailedGraphics(false);
      else if (targetViewId === 'view-battery-details') loadDetailedBattery(false);
      else if (targetViewId === 'view-update-check') loadUpdateView(false);
      else if (targetViewId === 'view-database-portal') loadDatabasePortalView();
    });
  });

  // Bind Refresh Buttons Click Actions
  const btnRefreshRam = document.getElementById('btn-refresh-ram');
  const btnRefreshSsd = document.getElementById('btn-refresh-ssd');
  const btnRefreshGraphics = document.getElementById('btn-refresh-graphics');
  const btnRefreshBatteryDetail = document.getElementById('btn-refresh-battery-detail');

  if (btnRefreshRam) {
    btnRefreshRam.addEventListener('click', async () => {
      log('Refreshing RAM specs...', 'info');
      await Promise.all([
        loadDetailedRAM(true),
        fetchRamBasic()
      ]);
    });
  }

  if (btnRefreshSsd) {
    btnRefreshSsd.addEventListener('click', async () => {
      log('Refreshing drive specs...', 'info');
      await Promise.all([
        loadDetailedSSD(true),
        fetchSsdBasic()
      ]);
      await loadDetailedSSD(true);
    });
  }

  if (btnRefreshGraphics) {
    btnRefreshGraphics.addEventListener('click', async () => {
      log('Refreshing GPU engines...', 'info');
      await loadDetailedGraphics(true);
    });
  }

  if (btnRefreshBatteryDetail) {
    btnRefreshBatteryDetail.addEventListener('click', async () => {
      log('Refreshing battery specs...', 'info');
      await loadDetailedBattery(true);
    });
  }

  // Detailed specification loaders with LocalStorage caching
  async function loadDetailedRAM(force = false) {
    const detailRamTotal = document.getElementById('detail-ram-total');
    if (detailRamTotal) detailRamTotal.textContent = systemSpecs.ram || 'Detecting...';

    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    const cached = cacheMode !== 'temporary' ? localStorage.getItem('qc_detailed_ram') : null;
    if (cached && !force) {
      renderRAMDetails(cached);
      return;
    }

    await fetchAllSpecs(force);
  }

  function renderRAMDetails(data) {
    const detailRamSlots = document.getElementById('detail-ram-slots');
    const slots = data.split('\n').map(s => s.trim()).filter(s => s);
    detailRamSlots.innerHTML = '';

    slots.forEach(slotStr => {
      const parts = slotStr.split('|');
      if (parts.length >= 4) {
        const locator = parts[0];
        const manufacturer = parts[1] || 'Generic';
        const capacity = parts[2];
        const speed = parts[3];
        const partNum = parts[4] || 'N/A';
        const voltage = parts[5] && parseInt(parts[5], 10) > 0 ? `${parseInt(parts[5], 10) / 1000}V` : 'N/A';

        const slotDiv = document.createElement('div');
        slotDiv.className = 'spec-row';
        slotDiv.innerHTML = `
          <span class="spec-label"><i class="fa-solid fa-microchip" style="color: var(--color-blue); margin-right: 6px;"></i> ${locator}</span>
          <span class="spec-value">
            <strong>${manufacturer} ${capacity}</strong> (${speed})
            <span style="display: block; font-size: 11.5px; color: var(--text-muted); margin-top: 3px; font-weight: 400;">Part: ${partNum} | Voltage: ${voltage}</span>
          </span>
        `;
        detailRamSlots.appendChild(slotDiv);
      }
    });
  }

  async function loadDetailedSSD(force = false) {
    const detailSsdTotal = document.getElementById('detail-ssd-total');
    if (detailSsdTotal) detailSsdTotal.textContent = systemSpecs.ssd || 'Detecting...';

    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    const cached = cacheMode !== 'temporary' ? localStorage.getItem('qc_detailed_ssd') : null;
    if (cached && !force) {
      renderSSDDetails(cached);
      return;
    }

    await fetchAllSpecs(force);
  }

  function renderSSDDetails(data) {
    const detailSsdList = document.getElementById('detail-ssd-list');
    const disks = data.split('\n').map(d => d.trim()).filter(d => d);
    detailSsdList.innerHTML = '';

    disks.forEach(diskStr => {
      const parts = diskStr.split('|');
      if (parts.length >= 6) {
        const index = parts[0];
        const model = parts[1];
        const size = parts[2];
        const interfaceType = parts[3];
        const serial = parts[4] || 'N/A';
        const mediaType = parts[5] || 'Unknown';
        const partitions = parts[6] || '0';
        const health = parts[7] || 'Unknown';
        const life = parts[8] || 'N/A';

        const icon = mediaType.toLowerCase().includes('ssd') ? 'fa-solid fa-bolt' : 'fa-solid fa-circle-notch';
        const healthColor = health.toLowerCase().includes('healthy') || health.match(/\d+%/) ? 'var(--color-green)' : 'var(--color-orange)';

        const iconColor = mediaType.toLowerCase().includes('ssd') ? 'var(--color-blue)' : 'var(--color-orange)';
        const diskDiv = document.createElement('div');
        diskDiv.className = 'spec-row';
        diskDiv.innerHTML = `
          <span class="spec-label"><i class="${icon}" style="color: ${iconColor}; margin-right: 6px;"></i> Drive #${index} (${mediaType})</span>
          <span class="spec-value">
            <strong>${model}</strong>
            <span style="display: block; font-size: 11.5px; color: var(--text-muted); margin-top: 3px; font-weight: 400; line-height: 1.45;">
              Size: ${size} | Conn: ${interfaceType} | Partitions: ${partitions} <br/> 
              Serial: ${serial} <br/>
              Health: <span style="color: ${healthColor}; font-weight: 600;">${health}</span> | Life Remaining: <span style="font-weight: 600;">${life}</span>
            </span>
          </span>
        `;
        detailSsdList.appendChild(diskDiv);
      }
    });
  }

  async function loadDetailedGraphics(force = false) {
    const detailGraphicsSummary = document.getElementById('detail-graphics-summary');
    if (detailGraphicsSummary) detailGraphicsSummary.textContent = systemSpecs.graphics || 'Detecting...';

    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    const cached = cacheMode !== 'temporary' ? localStorage.getItem('qc_detailed_graphics') : null;
    if (cached && !force) {
      renderGraphicsDetails(cached);
      return;
    }

    await fetchAllSpecs(force);
  }

  function renderGraphicsDetails(data) {
    const detailGraphicsList = document.getElementById('detail-graphics-list');
    const gpus = data.split('\n').map(g => g.trim()).filter(g => g);
    detailGraphicsList.innerHTML = '';

    gpus.forEach(gpuStr => {
      const parts = gpuStr.split('|');
      if (parts.length >= 5) {
        const name = parts[0];
        const processor = parts[1] || 'N/A';
        const driver = parts[2] || 'N/A';
        const memory = parts[3];
        const resolution = parts[4] || 'N/A';
        const refresh = parts[5] || 'N/A';

        const isDedicated = name.match(/NVIDIA|GeForce|RTX|GTX|Quadro|Arc/i) || (name.match(/AMD|Radeon/i) && !name.match(/Radeon.*Graphics|Vega/i));
        const icon = isDedicated ? 'fa-solid fa-gamepad' : 'fa-solid fa-desktop';

        const gpuDiv = document.createElement('div');
        gpuDiv.className = 'spec-row';
        gpuDiv.innerHTML = `
          <span class="spec-label"><i class="${icon}" style="color: var(--color-orange); margin-right: 6px;"></i> ${name}</span>
          <span class="spec-value">
            <strong>${processor}</strong> (${memory})
            <span style="display: block; font-size: 11.5px; color: var(--text-muted); margin-top: 3px; font-weight: 400;">Driver: ${driver} | Mode: ${resolution} @ ${refresh}</span>
          </span>
        `;
        detailGraphicsList.appendChild(gpuDiv);
      }
    });
  }

  async function loadDetailedBattery(force = false) {
    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    const cached = cacheMode !== 'temporary' ? localStorage.getItem('qc_detailed_battery') : null;
    if (cached && !force) {
      renderBatteryDetails(cached);
      return;
    }

    await fetchAllSpecs(force);
  }

  function renderBatteryDetails(data) {
    const detailBatteryList = document.getElementById('detail-battery-list');
    detailBatteryList.innerHTML = '';

    const parts = data.split('|').map(p => p.trim());
    if (parts.length >= 7) {
      const mfg = parts[0] || 'Generic';
      const serial = parts[1] || 'N/A';
      const chem = parts[2] || 'LIon';
      const design = parseInt(parts[3], 10) || 0;
      const full = parseInt(parts[4], 10) || 0;
      const cycles = parts[5] || '0';
      const voltMv = parseInt(parts[6], 10) || 0;

      const health = design > 0 ? Math.round((full / design) * 100) : 0;
      const voltV = voltMv > 0 ? `${Math.round(voltMv / 100) / 10} V` : 'N/A';
      const status = getBatteryStatus(health);

      const details = [
        { label: 'Manufacturer', value: mfg, icon: 'fa-solid fa-industry' },
        { label: 'Hardware Serial Number', value: serial, icon: 'fa-solid fa-barcode' },
        { label: 'Battery Chemistry', value: chem, icon: 'fa-solid fa-flask' },
        { label: 'Design Capacity', value: `${design.toLocaleString()} mWh`, icon: 'fa-solid fa-battery-empty' },
        { label: 'Full Charge Capacity', value: `${full.toLocaleString()} mWh`, icon: 'fa-solid fa-battery-full' },
        { label: 'Battery Health Condition', value: `${health}% (${status.text})`, icon: 'fa-solid fa-heart-pulse', highlight: true, color: status.color },
        { label: 'Hardware Charge Cycles', value: cycles, icon: 'fa-solid fa-arrows-spin' },
        { label: 'Current Battery Voltage', value: voltV, icon: 'fa-solid fa-bolt' }
      ];

      details.forEach(item => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'spec-row';
        if (item.highlight) {
          rowDiv.style.borderColor = item.color || 'rgba(16, 185, 129, 0.2)';
        }
        const valColor = item.color ? `color: ${item.color}; font-weight: 600;` : '';
        rowDiv.innerHTML = `
          <span class="spec-label"><i class="${item.icon}" style="color: var(--color-blue); margin-right: 6px;"></i> ${item.label}</span>
          <span class="spec-value" style="${valColor}">${item.value}</span>
        `;
        detailBatteryList.appendChild(rowDiv);
      });
    } else {
      detailBatteryList.innerHTML = '<div class="spec-row"><span class="spec-label">Invalid battery data structure.</span></div>';
    }
  }

  // Manual check updates panel loader
  function loadUpdateView(force = false) {
    const currentVersionLabel = document.getElementById('update-current-version-label');
    if (currentVersionLabel) {
      currentVersionLabel.textContent = systemSpecs.appVersion || '1.0.3';
    }
  }

  // Bind manual update check buttons
  const btnManualCheck = document.getElementById('btn-manual-check-update');
  const btnManualStartUpdate = document.getElementById('btn-manual-start-update');
  const inlineProgressContainer = document.getElementById('inline-update-progress-container');
  const inlineProgressStatus = document.getElementById('inline-update-progress-status');
  const inlineProgressPercent = document.getElementById('inline-update-progress-percent');
  const inlineProgressBar = document.getElementById('inline-update-progress-bar');

  const updateIcon = document.getElementById('update-status-icon');
  const updateTitle = document.getElementById('update-status-title');
  const updateDesc = document.getElementById('update-status-desc');

  let manualDownloadUrl = '';

  if (btnManualCheck) {
    btnManualCheck.addEventListener('click', async () => {
      btnManualCheck.disabled = true;
      const originalText = btnManualCheck.innerHTML;
      btnManualCheck.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Checking...`;

      updateIcon.className = 'fa-solid fa-arrows-rotate fa-spin';
      updateIcon.style.color = 'var(--color-blue)';
      updateTitle.textContent = 'Checking for Updates';
      updateDesc.textContent = 'Contacting GitHub Releases API...';

      try {
        const repoOwner = 'Rocky-Alex';
        const repoName = 'BC-Elite-QC';
        const currentVer = systemSpecs.appVersion || '1.0.3';

        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`);
        if (!response.ok) {
          throw new Error(`GitHub API returned status ${response.status}`);
        }

        const release = await response.json();
        const latestVer = release.tag_name.replace('v', '').trim();

        if (isNewerVersion(currentVer, latestVer)) {
          const asset = release.assets.find(a => a.name.endsWith('.exe') || a.name.includes('Setup'));
          if (asset) {
            manualDownloadUrl = asset.browser_download_url;

            updateIcon.className = 'fa-solid fa-circle-exclamation';
            updateIcon.style.color = 'var(--color-orange)';
            updateTitle.textContent = 'New Update Available!';
            updateDesc.innerHTML = `Version <strong>v${latestVer}</strong> is available (Current: v${currentVer}).<br>Click the install button below to begin downloading.`;

            btnManualCheck.style.display = 'none';
            btnManualStartUpdate.style.display = 'block';
          } else {
            throw new Error('No setup executable asset found in latest release.');
          }
        } else {
          updateIcon.className = 'fa-solid fa-circle-check';
          updateIcon.style.color = 'var(--color-green)';
          updateTitle.textContent = 'Up to Date';
          updateDesc.innerHTML = `You are running the latest version of <strong>BC Elite QC</strong> (v${currentVer}).`;

          btnManualCheck.disabled = false;
          btnManualCheck.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Check for Updates`;
        }
      } catch (err) {
        updateIcon.className = 'fa-solid fa-circle-xmark';
        updateIcon.style.color = 'var(--color-red)';
        updateTitle.textContent = 'Check Failed';
        updateDesc.innerHTML = `Error checking for updates: <span class="text-red">${err.message}</span>`;

        btnManualCheck.disabled = false;
        btnManualCheck.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Check for Updates`;
      }
    });
  }

  if (btnManualStartUpdate) {
    btnManualStartUpdate.addEventListener('click', async () => {
      btnManualStartUpdate.disabled = true;
      inlineProgressContainer.style.display = 'block';
      inlineProgressStatus.textContent = 'Downloading setup files...';

      try {
        log('Starting manual update download...', 'info');

        const downloadCmd = `
          $downloadUrl = "${manualDownloadUrl}"
          $tempPath = "$env:TEMP\\BC_Elite_QC_Setup.exe"
          try {
              $webClient = New-Object System.Net.WebClient
              $webClient.DownloadFile($downloadUrl, $tempPath)
              if (Test-Path $tempPath) {
                  Start-Process -FilePath $tempPath -Verb RunAs
                  "Success"
              } else {
                  "Download failed: file not created"
              }
          } catch {
              "Error: $_"
          }
        `.trim();

        const result = await electronAPI.getSystemSpec(downloadCmd);
        if (result.success && result.data && result.data.trim() === 'Success') {
          log('Manual update downloaded successfully. Spawning installer...', 'info');
          inlineProgressStatus.textContent = 'Launching installer... Closing app.';

          setTimeout(async () => {
            await electronAPI.windowControl('close');
          }, 1500);
        } else {
          const errMsg = result.data ? result.data.trim() : 'Unknown download error';
          throw new Error(errMsg);
        }
      } catch (err) {
        log(`Manual update failed: ${err.message}`, 'error');
        showCustomAlert(`Update download failed:\n${err.message}\n\nPlease try again or download manually.`, 'Update Failed', 'error');
        btnManualStartUpdate.disabled = false;
        inlineProgressContainer.style.display = 'none';
      }
    });
  }

  // Helper to load settings from localStorage into form fields
  function loadSettings() {
    const apiUrl = document.getElementById('setting-api-url');
    const apiToken = document.getElementById('setting-api-token');
    const autoRun = document.getElementById('setting-auto-run');
    const cacheMode = document.getElementById('setting-cache-mode');
    const excMin = document.getElementById('setting-excellent-min');
    const excMax = document.getElementById('setting-excellent-max');
    const gdMin = document.getElementById('setting-good-min');
    const gdMax = document.getElementById('setting-good-max');
    const bdMin = document.getElementById('setting-bad-min');
    const bdMax = document.getElementById('setting-bad-max');

    if (apiUrl) apiUrl.value = localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api';
    if (apiToken) apiToken.value = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';
    if (autoRun) {
      const stored = localStorage.getItem('setting_auto_run');
      autoRun.checked = stored === null ? true : stored === 'true';
    }
    if (cacheMode) cacheMode.value = localStorage.getItem('setting_cache_mode') || 'permanently';
    if (excMin) excMin.value = localStorage.getItem('setting_excellent_min') || '80';
    if (excMax) excMax.value = localStorage.getItem('setting_excellent_max') || '100';
    if (gdMin) gdMin.value = localStorage.getItem('setting_good_min') || '50';
    if (gdMax) gdMax.value = localStorage.getItem('setting_good_max') || '79';
    if (bdMin) bdMin.value = localStorage.getItem('setting_bad_min') || '0';
    if (bdMax) bdMax.value = localStorage.getItem('setting_bad_max') || '49';
  }

  // Settings Save Button Click Action
  const btnSaveSettings = document.getElementById('btn-save-settings');
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      const apiUrlInput = document.getElementById('setting-api-url');
      const apiTokenInput = document.getElementById('setting-api-token');
      const apiUrl = apiUrlInput ? apiUrlInput.value : (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api');
      const apiToken = apiTokenInput ? apiTokenInput.value : (localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a');
      const autoRun = document.getElementById('setting-auto-run')?.checked ? 'true' : 'false';
      const cacheMode = document.getElementById('setting-cache-mode')?.value || 'permanently';
      const excMin = document.getElementById('setting-excellent-min')?.value || '80';
      const excMax = document.getElementById('setting-excellent-max')?.value || '100';
      const gdMin = document.getElementById('setting-good-min')?.value || '50';
      const gdMax = document.getElementById('setting-good-max')?.value || '79';
      const bdMin = document.getElementById('setting-bad-min')?.value || '0';
      const bdMax = document.getElementById('setting-bad-max')?.value || '49';

      localStorage.setItem('setting_api_url', apiUrl);
      localStorage.setItem('setting_api_token', apiToken);
      localStorage.setItem('setting_auto_run', autoRun);
      localStorage.setItem('setting_cache_mode', cacheMode);
      localStorage.setItem('setting_excellent_min', excMin);
      localStorage.setItem('setting_excellent_max', excMax);
      localStorage.setItem('setting_good_min', gdMin);
      localStorage.setItem('setting_good_max', gdMax);
      localStorage.setItem('setting_bad_min', bdMin);
      localStorage.setItem('setting_bad_max', bdMax);

      // If set to temporary or auto-clear, flush existing cache immediately
      if (cacheMode === 'temporary' || cacheMode === 'autoclear') {
        localStorage.removeItem('qc_detailed_ram');
        localStorage.removeItem('qc_detailed_ssd');
        localStorage.removeItem('qc_detailed_graphics');
        localStorage.removeItem('qc_detailed_battery');
        localStorage.removeItem('qc_basic_specs');
      }

      log('Configuration profiles successfully synchronized locally.', 'ready');

      // Refresh battery status dynamically on main page
      const specElement = document.getElementById('spec-battery-health');
      if (specElement && systemSpecs.battery) {
        const match = systemSpecs.battery.match(/(\d+)%/);
        if (match) {
          const percent = parseInt(match[1], 10);
          const status = getBatteryStatus(percent);
          const cyclesMatch = systemSpecs.battery.match(/\(([^)]+)\)/);
          const cyclesStr = cyclesMatch ? ` (${cyclesMatch[1]})` : '';
          specElement.innerHTML = `<span style="color: ${status.color}; font-weight: 700;">${percent}% (${status.text})</span>${cyclesStr}`;
          systemSpecs.battery = `${percent}% (${status.text})${cyclesStr}`;
        }
      }

      // Force refresh the detail views if already cached
      loadDetailedBattery(true);

      showCustomAlert('System settings: diagnostic limits and battery health ranges are saved successfully.', 'Settings Saved', 'success');
    });
  }

  // Reset API URL to production default
  const btnResetApiUrl = document.getElementById('btn-reset-api-url');
  if (btnResetApiUrl) {
    btnResetApiUrl.addEventListener('click', () => {
      const DEFAULT_API_URL = 'https://www.bizzcohub.com/api';
      const DEFAULT_API_TOKEN = 'bch_live_secret_7742a';

      localStorage.setItem('setting_api_url', DEFAULT_API_URL);
      localStorage.setItem('setting_api_token', DEFAULT_API_TOKEN);

      const apiUrlInput = document.getElementById('setting-api-url');
      const apiTokenInput = document.getElementById('setting-api-token');
      if (apiUrlInput) apiUrlInput.value = DEFAULT_API_URL;
      if (apiTokenInput) apiTokenInput.value = DEFAULT_API_TOKEN;

      log('API URL reset to production default: ' + DEFAULT_API_URL, 'ready');
      showCustomAlert('API URL has been reset to the production server.', 'Settings Reset', 'success');
    });
  }


  // Support Ticket Action
  const btnSupportTicket = document.getElementById('btn-support-ticket');
  if (btnSupportTicket) {
    btnSupportTicket.addEventListener('click', () => {
      log('Opening support contact page in default browser...', 'info');
      window.open('https://www.bizzcohub.com/contact', '_blank');
    });
  }

  // =========================================================
  // DATABASE PORTAL PAGE ACTION WORKFLOWS
  // =========================================================

  function loadDatabasePortalView() {
    const pageLoginSection = document.getElementById('page-portal-login-section');
    const pageDashboardSection = document.getElementById('page-portal-dashboard-section');
    const pageLoggedUser = document.getElementById('page-portal-logged-user');
    const pageActiveBatch = document.getElementById('page-portal-active-batch');

    if (currentOperator) {
      if (pageLoggedUser) pageLoggedUser.textContent = currentOperator;
      if (pageActiveBatch) pageActiveBatch.textContent = activeBatchCode || 'None (Create or assign batch below)';
      if (pageLoginSection) pageLoginSection.style.display = 'none';
      if (pageDashboardSection) { pageDashboardSection.style.display = 'flex'; }
      // Load batches grid after showing the dashboard
      loadPortalBatches();
    } else {
      if (pageLoginSection) pageLoginSection.style.display = 'block';
      if (pageDashboardSection) pageDashboardSection.style.display = 'none';
      const userField = document.getElementById('page-portal-username');
      const passField = document.getElementById('page-portal-password');
      const errField = document.getElementById('page-portal-login-error');
      if (userField) userField.value = '';
      if (passField) passField.value = '';
      if (errField) errField.style.display = 'none';
      // Reset records section
      const recSection = document.getElementById('portal-records-section');
      if (recSection) recSection.style.display = 'none';
    }
  }

  const btnPagePortalLogin = document.getElementById('btn-page-portal-login');
  if (btnPagePortalLogin) {
    btnPagePortalLogin.addEventListener('click', async () => {
      const username = document.getElementById('page-portal-username')?.value.trim() || '';
      const password = document.getElementById('page-portal-password')?.value.trim() || '';
      const loginError = document.getElementById('page-portal-login-error');

      if (!username || !password) {
        if (loginError) {
          loginError.textContent = 'Username and password are required.';
          loginError.style.display = 'block';
        }
        return;
      }

      btnPagePortalLogin.disabled = true;
      const originalText = btnPagePortalLogin.innerHTML;
      btnPagePortalLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
      if (loginError) loginError.style.display = 'none';

      const rememberCheckbox = document.getElementById('page-portal-remember');
      const isRemember = rememberCheckbox ? rememberCheckbox.checked : false;

      try {
        const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
        const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';

        const response = await electronAPI.httpPost(`${apiUrl}/qc/auth`, { username, password }, token);

        if (response.success && response.data && response.data.success) {
          currentOperator = response.data.operator;
          log(`QC Operator Session Authorized (Database page): "${currentOperator}"`, 'ready');
          loadDatabasePortalView();
          saveOperatorRememberCredentials(username, password, isRemember);
        } else {
          // Fallback to local admin check
          const isLocalValid = (username.toLowerCase() === 'admin' || username.toLowerCase() === 'operator') && password === 'password';
          if (isLocalValid) {
            currentOperator = username;
            log(`QC Operator Session Authorized via Local Fallback (Database page): "${currentOperator}"`, 'ready');
            loadDatabasePortalView();
            saveOperatorRememberCredentials(username, password, isRemember);
          } else {
            if (loginError) {
              const errMsg = response.data?.error || response.error || 'Invalid credentials.';
              loginError.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${errMsg}`;
              loginError.style.display = 'block';
            }
          }
        }
      } catch (err) {
        // Fallback to local admin check
        const isLocalValid = (username.toLowerCase() === 'admin' || username.toLowerCase() === 'operator') && password === 'password';
        if (isLocalValid) {
          currentOperator = username;
          log(`QC Operator Session Authorized via Local Fallback (Database page): "${currentOperator}"`, 'ready');
          loadDatabasePortalView();
          saveOperatorRememberCredentials(username, password, isRemember);
        } else {
          if (loginError) {
            loginError.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Authentication error: ${err.message || err}`;
            loginError.style.display = 'block';
          }
        }
      } finally {
        btnPagePortalLogin.disabled = false;
        btnPagePortalLogin.innerHTML = originalText;
      }
    });
  }

  const btnPagePortalLogout = document.getElementById('btn-page-portal-logout');
  if (btnPagePortalLogout) {
    btnPagePortalLogout.addEventListener('click', () => {
      log(`Operator "${currentOperator}" signed out from Database page.`, 'info');
      currentOperator = '';
      loadDatabasePortalView();
    });
  }

  // =========================================================
  // PORTAL: BATCH RECORDS HELPERS
  // =========================================================
  let portalCurrentBatch = '';   // batch code currently displayed in records table
  let portalRecords = [];        // records currently loaded
  let portalBatches = [];        // batches loaded from server

  function openPortalModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  }

  function closePortalModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  // Wire all close buttons
  document.querySelectorAll('.portal-modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-close');
      if (target) closePortalModal(target);
    });
  });

  // Close on overlay click
  document.querySelectorAll('.portal-inline-modal').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });

  // ── Render batches grid ──
  async function loadPortalBatches() {
    const grid = document.getElementById('portal-batches-grid');
    const emptyEl = document.getElementById('portal-batches-empty');
    const loadingEl = document.getElementById('portal-batches-loading');
    if (!grid) return;

    if (loadingEl) loadingEl.style.display = 'flex';
    grid.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'none';

    try {
      const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
      const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';
      const result = await electronAPI.httpGet(`${apiUrl}/create-batch`, token);
      portalBatches = (result && result.success && result.data && result.data.batches) ? result.data.batches : [];
    } catch (e) {
      portalBatches = [];
    }

    if (loadingEl) loadingEl.style.display = 'none';
    renderBatchesGrid();
  }

  function renderBatchesGrid() {
    const grid = document.getElementById('portal-batches-grid');
    const emptyEl = document.getElementById('portal-batches-empty');
    if (!grid) return;

    grid.innerHTML = '';

    if (portalBatches.length === 0) {
      grid.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (emptyEl) emptyEl.style.display = 'none';

    portalBatches.forEach(b => {
      const isActive = activeBatchCode === b.batchCode;
      const card = document.createElement('div');
      card.className = 'portal-batch-item' + (isActive ? ' active' : '');
      card.dataset.batch = b.batchCode;
      card.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <strong style="font-size: 13.5px; color: var(--text-main); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.batchCode}</strong>
          <span style="font-size: 11.5px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; margin-top: 4px;">
            <i class="fa-solid fa-laptop" style="font-size: 10px;"></i>
            ${b.deviceCount} synced device${b.deviceCount === 1 ? '' : 's'}
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <button class="batch-action-btn" data-action="rename" data-batch="${b.batchCode}" title="Rename"><i class="fa-solid fa-pen" style="font-size:12px;"></i></button>
          <button class="batch-action-btn danger" data-action="delete" data-batch="${b.batchCode}" title="Delete"><i class="fa-solid fa-trash" style="font-size:12px;"></i></button>
        </div>`;

      // Click card body → set active + load records
      card.addEventListener('click', (e) => {
        if (e.target.closest('.batch-action-btn')) return;
        activeBatchCode = b.batchCode;
        document.getElementById('page-portal-active-batch').textContent = activeBatchCode;
        renderBatchesGrid();
        fetchPortalRecords(activeBatchCode);
      });

      // Rename button
      card.querySelector('[data-action="rename"]').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('portal-rename-old').value = b.batchCode;
        document.getElementById('portal-rename-new').value = b.batchCode;
        openPortalModal('portal-modal-rename');
        setTimeout(() => document.getElementById('portal-rename-new').focus(), 100);
      });

      // Delete button
      card.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = confirm(`Delete batch "${b.batchCode}"? This will remove all synced device specs under it.`);
        if (!confirmed) return;
        try {
          const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
          const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';
          const result = await electronAPI.httpPost(`${apiUrl}/delete-batch`, { batchCode: b.batchCode }, token);
          if (result.success) {
            showCustomAlert(`Batch "${b.batchCode}" deleted.`, 'Deleted', 'success');
            if (activeBatchCode === b.batchCode) {
              activeBatchCode = '';
              document.getElementById('page-portal-active-batch').textContent = 'None (Create or assign batch below)';
              document.getElementById('portal-records-section').style.display = 'none';
            }
            await loadPortalBatches();
          } else {
            showCustomAlert(result.error || 'Failed to delete batch.', 'Error', 'error');
          }
        } catch (err) {
          showCustomAlert(`Delete failed: ${err.message}`, 'Error', 'error');
        }
      });

      grid.appendChild(card);
    });
  }

  // ── Fetch and render records ──
  async function fetchPortalRecords(batchCode) {
    if (!batchCode) return;
    portalCurrentBatch = batchCode;

    const section = document.getElementById('portal-records-section');
    const loadingEl = document.getElementById('portal-records-loading');
    const emptyEl = document.getElementById('portal-records-empty');
    const tableWrap = document.getElementById('portal-records-table-wrap');
    const label = document.getElementById('portal-records-batch-label');
    const countEl = document.getElementById('portal-records-count');

    if (section) section.style.display = 'flex';
    if (loadingEl) loadingEl.style.display = 'flex';
    if (emptyEl) emptyEl.style.display = 'none';
    if (tableWrap) tableWrap.style.display = 'none';
    if (label) label.textContent = batchCode;

    try {
      const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
      const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';
      const result = await electronAPI.httpGet(`${apiUrl}/get-details?batchCode=${encodeURIComponent(batchCode)}`, token);
      portalRecords = (result && result.success && Array.isArray(result.data)) ? result.data : [];
    } catch (e) {
      portalRecords = [];
    }

    if (loadingEl) loadingEl.style.display = 'none';

    if (countEl) countEl.textContent = ` (${portalRecords.length} device${portalRecords.length === 1 ? '' : 's'})`;

    if (portalRecords.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    // Render rows
    const tbody = document.getElementById('portal-records-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    portalRecords.forEach((r, i) => {
      const s = r.specs || {};
      const dateStr = r.timestamp ? new Date(r.timestamp).toLocaleDateString() : 'N/A';
      const tr = document.createElement('tr');
      tr.style.borderBottom = i < portalRecords.length - 1 ? '1px solid var(--border-color)' : 'none';
      tr.innerHTML = `
        <td style="padding: 12px 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-laptop" style="color: var(--color-blue); font-size: 14px;"></i>
            <strong style="font-weight: 500;">${s.productName || 'Unknown Device'}</strong>
          </div>
        </td>
        <td style="padding: 12px 16px;">
          <code style="font-size: 12px; background: rgba(120,120,128,0.1); padding: 2px 6px; border-radius: 4px;">${s.serialNumber || 'N/A'}</code>
        </td>
        <td style="padding: 12px 16px; font-size: 12px;">
          ${s.cpu || 'N/A'}<br>
          <span style="color: var(--text-secondary); font-size: 11px;">${s.windowsVer || 'N/A'}</span>
        </td>
        <td style="padding: 12px 16px; font-size: 12px;">
          RAM: ${s.ram || 'N/A'}<br>SSD: ${s.ssd || 'N/A'}
        </td>
        <td style="padding: 12px 16px; font-size: 12px;">${s.battery || 'N/A'}</td>
        <td style="padding: 12px 16px; font-size: 11.5px; color: var(--text-secondary);">
          <div style="display: flex; align-items: center; gap: 4px;">
            <i class="fa-regular fa-calendar" style="font-size: 11px;"></i> ${dateStr}
          </div>
          <span style="font-size: 10.5px;">by ${r.operator || 'N/A'}</span>
        </td>`;
      tbody.appendChild(tr);
    });

    if (tableWrap) tableWrap.style.display = 'block';
  }

  // ── Button: Create Batch → opens modal ──
  const btnPageCreateBatch = document.getElementById('btn-page-create-batch');
  if (btnPageCreateBatch) {
    btnPageCreateBatch.addEventListener('click', () => {
      const inp = document.getElementById('portal-create-input');
      if (inp) inp.value = '';
      openPortalModal('portal-modal-create');
      setTimeout(() => { if (inp) inp.focus(); }, 100);
    });
  }

  // Confirm: Create Batch
  const btnPortalCreateConfirm = document.getElementById('btn-portal-create-confirm');
  if (btnPortalCreateConfirm) {
    btnPortalCreateConfirm.addEventListener('click', async () => {
      const inp = document.getElementById('portal-create-input');
      const cleanBatchCode = inp ? inp.value.trim() : '';
      if (!cleanBatchCode) { showCustomAlert('A valid Batch Code must be provided.', 'Validation Error', 'warn'); return; }

      btnPortalCreateConfirm.disabled = true;
      const origText = btnPortalCreateConfirm.innerHTML;
      btnPortalCreateConfirm.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';

      try {
        const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
        const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';
        const result = await electronAPI.httpPost(`${apiUrl}/create-batch`, { batchCode: cleanBatchCode, operator: currentOperator, sessionId }, token);

        if (result.success) {
          activeBatchCode = cleanBatchCode;
          document.getElementById('page-portal-active-batch').textContent = activeBatchCode;
          closePortalModal('portal-modal-create');
          log(`Batch "${activeBatchCode}" registered in database.`, 'ready');
          showCustomAlert(`Batch "${activeBatchCode}" created and recorded.`, 'Batch Created', 'success');
          await loadPortalBatches();
          await fetchPortalRecords(activeBatchCode);
        } else {
          let errMsg = result.error || 'Failed to create batch.';
          const m = errMsg.match(/HTTP \d+:\s*(\{.*\})/i);
          if (m) { try { const o = JSON.parse(m[1]); if (o.error) errMsg = o.error; } catch(e){} }
          showCustomAlert(errMsg, 'Batch Error', 'error');
        }
      } catch (err) {
        activeBatchCode = cleanBatchCode;
        document.getElementById('page-portal-active-batch').textContent = activeBatchCode;
        closePortalModal('portal-modal-create');
        showCustomAlert(`Offline mode: Batch "${cleanBatchCode}" set locally only.`, 'Offline', 'warn');
      } finally {
        btnPortalCreateConfirm.disabled = false;
        btnPortalCreateConfirm.innerHTML = origText;
      }
    });
  }

  // ── Button: View Batch → load records for active batch ──
  const btnPageViewBatch = document.getElementById('btn-page-view-batch');
  if (btnPageViewBatch) {
    btnPageViewBatch.addEventListener('click', () => {
      if (!activeBatchCode) {
        showCustomAlert("No active batch set. Click 'Create Batch' first.", 'No Batch', 'warn');
        return;
      }
      fetchPortalRecords(activeBatchCode);
    });
  }

  function formatSpecsForUpload(rawSpecs) {
    const formatted = { ...rawSpecs };

    // 1. Format Product Name: Brand > Series > Model
    let rawName = (rawSpecs.productName || '').trim();
    let brand = '';
    let series = '';
    let model = rawName;

    const brands = ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI', 'Microsoft', 'Toshiba', 'Samsung', 'Gigabyte', 'Huawei'];
    const matchedBrand = brands.find(b => new RegExp('\\b' + b + '\\b', 'i').test(rawName));
    if (matchedBrand) {
      brand = matchedBrand;
      model = model.replace(new RegExp('\\b' + brand + '\\b', 'ig'), '').trim();
      
      const seriesMap = {
        'HP': ['EliteBook', 'ProBook', 'Pavilion', 'Envy', 'Spectre', 'ZBook', 'Omen', 'Victus', 'Essential', 'Notebook'],
        'Dell': ['Latitude', 'Inspiron', 'XPS', 'Precision', 'Vostro', 'Alienware'],
        'Lenovo': ['ThinkPad', 'IdeaPad', 'Yoga', 'Legion', 'ThinkBook'],
        'Microsoft': ['Surface Laptop', 'Surface Book', 'Surface Pro', 'Surface'],
        'Apple': ['MacBook Pro', 'MacBook Air', 'MacBook']
      };

      const brandSeries = seriesMap[brand] || [];
      const matchedSeries = brandSeries.find(s => new RegExp('\\b' + s + '\\b', 'i').test(model));
      if (matchedSeries) {
        series = matchedSeries;
        model = model.replace(new RegExp('\\b' + series + '\\b', 'ig'), '').trim();
      }
    }

    if (brand) {
      const parts = [brand];
      if (series) parts.push(series);
      if (model) parts.push(model);
      formatted.productName = parts.join(' > ');
    }

    // 2. Core and Gen parsing
    const cpuStr = rawSpecs.cpu || '';
    let coreVal = '';
    let genVal = '';
    let cpuFull = '';

    const coreMatch = cpuStr.match(/\bi[3579]\b/i);
    if (coreMatch) {
      coreVal = `Intel Core ${coreMatch[0].toLowerCase()}`;
    } else if (/ryzen/i.test(cpuStr)) {
      const ryzenMatch = cpuStr.match(/ryzen\s+[3579]/i);
      coreVal = ryzenMatch ? ryzenMatch[0] : 'AMD Ryzen';
    } else {
      coreVal = cpuStr.split('@')[0].trim();
    }

    const modelMatch = cpuStr.match(/\b(i[3579]-\d{4,5}[a-z]{0,2}|ryzen\s+[3579]\s+\d{4}[a-z]{0,2})\b/i);
    if (modelMatch) {
      cpuFull = modelMatch[0];
    } else {
      const fallbackMatch = cpuStr.match(/([a-z0-9]+-\d+[a-z0-9]*)/i);
      if (fallbackMatch) cpuFull = fallbackMatch[1];
    }

    const genMatch = cpuStr.match(/i[3579]-(\d{1,2})\d{3}/i);
    if (genMatch) {
      const num = parseInt(genMatch[1]);
      let suffix = 'th';
      if (num % 10 === 1 && num % 100 !== 11) suffix = 'st';
      else if (num % 10 === 2 && num % 100 !== 12) suffix = 'nd';
      else if (num % 10 === 3 && num % 100 !== 13) suffix = 'rd';
      genVal = `${num}${suffix} gen`;
    }

    if (coreVal) {
      formatted.cpu = `${coreVal}`;
      if (cpuFull || genVal) {
        formatted.cpu += ` (${cpuFull || 'N/A'}, ${genVal || 'N/A'})`;
      }
    }

    // 3. Dual Graphics Parsing
    const gpus = (rawSpecs.graphics || '').split('/');
    let formattedGraphics = '';
    gpus.forEach((gpu) => {
      const cleanGpu = gpu.trim();
      if (!cleanGpu) return;
      const isDedicated = /nvidia|geforce|rtx|gtx|quadro|arc/i.test(cleanGpu);
      const type = isDedicated ? 'Dedicated' : 'Integrated';
      
      let size = '';
      const sizeMatch = cleanGpu.match(/\((\d+\s*GB)\)/i);
      if (sizeMatch) {
        size = sizeMatch[1];
      } else {
        size = isDedicated ? 'VRAM' : 'Shared';
      }

      const gpuName = cleanGpu.replace(/\(\d+\s*GB\)/i, '').trim();

      if (formattedGraphics) formattedGraphics += ' / ';
      formattedGraphics += `${type}: ${gpuName} (${size})`;
    });
    if (formattedGraphics) formatted.graphics = formattedGraphics;

    return formatted;
  }

  async function performDetailsUpload() {
    if (!activeBatchCode) return;

    log(`Uploading specifications to database under batch: ${activeBatchCode}...`, 'info');
    const btnPageUploadDetails = document.getElementById('btn-page-upload-details');
    let originalBtnText = '';
    if (btnPageUploadDetails) {
      btnPageUploadDetails.disabled = true;
      originalBtnText = btnPageUploadDetails.innerHTML;
      btnPageUploadDetails.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;
    }

    const formattedSpecs = formatSpecsForUpload(systemSpecs);

    const payload = {
      batchCode: activeBatchCode,
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      operator: currentOperator,
      specs: {
        ...formattedSpecs,
        operator: currentOperator
      }
    };

    try {
      const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
      const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';

      const result = await electronAPI.httpPost(`${apiUrl}/upload-details`, payload, token);
      if (result.success) {
        log(`Uploaded specifications under batch: ${activeBatchCode}`, 'ready');
        showCustomAlert(`Product specifications successfully logged under Batch: ${activeBatchCode}`, 'Upload Success', 'success');
        saveRecordToHistory(`Uploaded to ${activeBatchCode} (by ${currentOperator})`);
        
        // Refresh records list if showing current batch
        if (portalCurrentBatch && portalCurrentBatch.toLowerCase() === activeBatchCode.toLowerCase()) {
          fetchPortalRecords(portalCurrentBatch);
        }
        loadPortalBatches();
      } else {
        throw new Error(result.error || 'Server error');
      }
    } catch (err) {
      log(`Database upload failure: ${err.message || err}`, 'error');
      
      let cleanErrMsg = err.message || String(err);
      const httpErrMatch = cleanErrMsg.match(/HTTP \d+:\s*(\{.*\})/i);
      if (httpErrMatch) {
        try {
          const errObj = JSON.parse(httpErrMatch[1]);
          if (errObj.error) {
            cleanErrMsg = errObj.error;
          }
        } catch (e) {
          // fallback
        }
      }
      showCustomAlert(`Sync Failure: ${cleanErrMsg}`, 'Sync Failure', 'error');
    } finally {
      if (btnPageUploadDetails) {
        btnPageUploadDetails.disabled = false;
        btnPageUploadDetails.innerHTML = originalBtnText;
      }
    }
  }

  const btnPageUploadDetails = document.getElementById('btn-page-upload-details');
  if (btnPageUploadDetails) {
    btnPageUploadDetails.addEventListener('click', () => {
      if (!systemSpecs.serialNumber) {
        showCustomAlert('Diagnostics must be completed before database upload.', 'Upload Error', 'warn');
        return;
      }

      openSpecsUploadPreview();
    });
  }

  // Confirm Assign Batch (Overlay Modal)
  const btnPortalAssignConfirm = document.getElementById('btn-portal-assign-confirm');
  if (btnPortalAssignConfirm) {
    btnPortalAssignConfirm.addEventListener('click', () => {
      const codeInp = document.getElementById('portal-assign-input');
      const cleanBatchCode = codeInp ? codeInp.value.trim() : '';
      if (!cleanBatchCode) {
        showCustomAlert('A valid Batch Code must be provided to upload.', 'Validation Error', 'warn');
        return;
      }

      activeBatchCode = cleanBatchCode;
      const pageActiveBatch = document.getElementById('page-portal-active-batch');
      if (pageActiveBatch) pageActiveBatch.textContent = activeBatchCode;

      closePortalModal('portal-modal-assign');
      performDetailsUpload();
    });
  }

  // Enter key support for assign input
  const assignInpField = document.getElementById('portal-assign-input');
  if (assignInpField) {
    assignInpField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('btn-portal-assign-confirm')?.click();
      }
    });
  }

  // ── Button: History Lookup → opens search modal ──
  const btnPageViewHistory = document.getElementById('btn-page-view-history');
  if (btnPageViewHistory) {
    btnPageViewHistory.addEventListener('click', () => {
      const inp = document.getElementById('portal-lookup-input');
      if (inp) inp.value = '';
      openPortalModal('portal-modal-lookup');
      setTimeout(() => { if (inp) inp.focus(); }, 100);
    });
  }

  // Confirm: History Lookup
  const btnPortalLookupConfirm = document.getElementById('btn-portal-lookup-confirm');
  if (btnPortalLookupConfirm) {
    btnPortalLookupConfirm.addEventListener('click', () => {
      const inp = document.getElementById('portal-lookup-input');
      const code = inp ? inp.value.trim() : '';
      if (!code) { showCustomAlert('Enter a Batch Code to search.', 'Required', 'warn'); return; }
      closePortalModal('portal-modal-lookup');
      fetchPortalRecords(code);
    });
  }

  // Confirm: Rename Batch
  const btnPortalRenameConfirm = document.getElementById('btn-portal-rename-confirm');
  if (btnPortalRenameConfirm) {
    btnPortalRenameConfirm.addEventListener('click', async () => {
      const oldCode = document.getElementById('portal-rename-old').value;
      const newCode = document.getElementById('portal-rename-new').value.trim();
      if (!newCode) { showCustomAlert('New name cannot be empty.', 'Required', 'warn'); return; }
      if (newCode.toLowerCase() === oldCode.toLowerCase()) { closePortalModal('portal-modal-rename'); return; }

      btnPortalRenameConfirm.disabled = true;
      const orig = btnPortalRenameConfirm.innerHTML;
      btnPortalRenameConfirm.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      try {
        const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
        const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';
        const result = await electronAPI.httpPost(`${apiUrl}/rename-batch`, { oldBatchCode: oldCode, newBatchCode: newCode }, token);
        if (result.success) {
          if (activeBatchCode === oldCode) {
            activeBatchCode = newCode;
            document.getElementById('page-portal-active-batch').textContent = activeBatchCode;
          }
          if (portalCurrentBatch === oldCode) await fetchPortalRecords(newCode);
          closePortalModal('portal-modal-rename');
          showCustomAlert(`Batch renamed to "${newCode}".`, 'Renamed', 'success');
          await loadPortalBatches();
        } else {
          showCustomAlert(result.error || 'Rename failed.', 'Error', 'error');
        }
      } catch (err) {
        showCustomAlert(`Rename error: ${err.message}`, 'Error', 'error');
      } finally {
        btnPortalRenameConfirm.disabled = false;
        btnPortalRenameConfirm.innerHTML = orig;
      }
    });
  }

  // Enter key submits in modals
  ['portal-create-input', 'portal-lookup-input', 'portal-rename-new'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (id === 'portal-create-input') document.getElementById('btn-portal-create-confirm')?.click();
          if (id === 'portal-lookup-input') document.getElementById('btn-portal-lookup-confirm')?.click();
          if (id === 'portal-rename-new') document.getElementById('btn-portal-rename-confirm')?.click();
        }
      });
    }
  });

  // Refresh records button
  const btnPortalRefreshRecords = document.getElementById('btn-portal-refresh-records');
  if (btnPortalRefreshRecords) {
    btnPortalRefreshRecords.addEventListener('click', () => {
      if (portalCurrentBatch) fetchPortalRecords(portalCurrentBatch);
      loadPortalBatches();
    });
  }

  // ── Button: Update Details (card) → opens modal ──
  const btnPagePortalUpdate = document.getElementById('btn-page-portal-update');
  if (btnPagePortalUpdate) {
    btnPagePortalUpdate.addEventListener('click', () => {
      document.getElementById('portal-update-serial-input').value = '';
      document.getElementById('portal-update-step-retrieve').style.display = 'flex';
      document.getElementById('portal-update-step-form').style.display = 'none';
      document.getElementById('portal-update-card').style.maxWidth = '440px';
      openPortalModal('portal-modal-update');
      setTimeout(() => document.getElementById('portal-update-serial-input').focus(), 100);
    });
  }

  // Step 1: Retrieve Specs
  const btnPortalUpdateRetrieve = document.getElementById('btn-portal-update-retrieve');
  if (btnPortalUpdateRetrieve) {
    btnPortalUpdateRetrieve.addEventListener('click', async () => {
      const serialInp = document.getElementById('portal-update-serial-input');
      const serialNumber = serialInp ? serialInp.value.trim() : '';
      if (!serialNumber) { showCustomAlert('Enter a Serial Number to lookup.', 'Required', 'warn'); return; }

      btnPortalUpdateRetrieve.disabled = true;
      const origText = btnPortalUpdateRetrieve.innerHTML;
      btnPortalUpdateRetrieve.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Retrieving...';

      try {
        const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
        const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';
        const result = await electronAPI.httpGet(`${apiUrl}/get-by-serial?serialNumber=${encodeURIComponent(serialNumber)}`, token);

        if (result && result.success && result.data && result.data.success && result.data.device) {
          const device = result.data.device;
          const s = device.specs || {};

          // Populate form fields
          document.getElementById('portal-update-form-serial').value = s.serialNumber || serialNumber;
          document.getElementById('portal-update-form-product').value = s.productName || '';
          document.getElementById('portal-update-form-cpu').value = s.cpu || '';
          document.getElementById('portal-update-form-ram').value = s.ram || '';
          document.getElementById('portal-update-form-ssd').value = s.ssd || '';
          document.getElementById('portal-update-form-graphics').value = s.graphics || '';
          document.getElementById('portal-update-form-battery').value = s.battery || '';
          document.getElementById('portal-update-form-windows').value = s.windowsVer || '';
          document.getElementById('portal-update-form-batch').value = device.batchCode || '';
          document.getElementById('portal-update-form-brand').value = s.brand || '';
          document.getElementById('portal-update-form-series').value = s.series || '';
          document.getElementById('portal-update-form-model').value = s.model || '';
          document.getElementById('portal-update-form-gen').value = s.gen || '';
          document.getElementById('portal-update-form-display').value = s.displayRes || '';
          document.getElementById('portal-update-form-ssd-health').value = s.ssdHealth || '';

          const remarkPartsSelect = document.getElementById('portal-update-form-remark-parts');
          if (remarkPartsSelect) {
            remarkPartsSelect.value = s.partsIssues || '';
          }
          document.getElementById('portal-update-form-remark-text').value = s.issues || '';

          // Transition UI
          document.getElementById('portal-update-step-retrieve').style.display = 'none';
          document.getElementById('portal-update-step-form').style.display = 'flex';
          document.getElementById('portal-update-card').style.maxWidth = '900px';
        } else {
          const errMsg = (result && result.data && result.data.error) ? result.data.error : 'Serial Number not found.';
          showCustomAlert(errMsg, 'Not Found', 'error');
        }
      } catch (err) {
        showCustomAlert(`Lookup failed: ${err.message || err}`, 'Error', 'error');
      } finally {
        btnPortalUpdateRetrieve.disabled = false;
        btnPortalUpdateRetrieve.innerHTML = origText;
      }
    });
  }

  // Step 2: Back button
  const btnPortalUpdateBack = document.getElementById('btn-portal-update-back');
  if (btnPortalUpdateBack) {
    btnPortalUpdateBack.addEventListener('click', () => {
      document.getElementById('portal-update-step-retrieve').style.display = 'flex';
      document.getElementById('portal-update-step-form').style.display = 'none';
      document.getElementById('portal-update-card').style.maxWidth = '440px';
    });
  }

  // Step 2: Save specs
  const btnPortalUpdateSave = document.getElementById('btn-portal-update-save');
  if (btnPortalUpdateSave) {
    btnPortalUpdateSave.addEventListener('click', async () => {
      const serialNumber = document.getElementById('portal-update-form-serial').value;
      const batchCode = document.getElementById('portal-update-form-batch').value.trim();

      const updatedSpecs = {
        serialNumber: serialNumber,
        productName: document.getElementById('portal-update-form-product').value.trim(),
        cpu: document.getElementById('portal-update-form-cpu').value.trim(),
        ram: document.getElementById('portal-update-form-ram').value.trim(),
        ssd: document.getElementById('portal-update-form-ssd').value.trim(),
        graphics: document.getElementById('portal-update-form-graphics').value.trim(),
        battery: document.getElementById('portal-update-form-battery').value.trim(),
        windowsVer: document.getElementById('portal-update-form-windows').value.trim(),
        brand: document.getElementById('portal-update-form-brand').value.trim(),
        series: document.getElementById('portal-update-form-series').value.trim(),
        model: document.getElementById('portal-update-form-model').value.trim(),
        gen: document.getElementById('portal-update-form-gen').value.trim(),
        displayRes: document.getElementById('portal-update-form-display').value.trim(),
        ssdHealth: formatSsdHealthPercentage(document.getElementById('portal-update-form-ssd-health').value),
        partsIssues: document.getElementById('portal-update-form-remark-parts').value,
        issues: document.getElementById('portal-update-form-remark-text').value.trim()
      };

      btnPortalUpdateSave.disabled = true;
      const origText = btnPortalUpdateSave.innerHTML;
      btnPortalUpdateSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

      try {
        const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
        const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';
        const payload = { serialNumber, updatedSpecs, batchCode };
        const result = await electronAPI.httpPost(`${apiUrl}/update-by-serial`, payload, token);

        if (result && result.success && result.data && result.data.success) {
          closePortalModal('portal-modal-update');
          showCustomAlert('Device diagnostics successfully updated.', 'Success', 'success');
          // Refresh records list if displaying matching batch
          if (portalCurrentBatch && portalCurrentBatch.toLowerCase() === batchCode.toLowerCase()) {
            fetchPortalRecords(portalCurrentBatch);
          }
          loadPortalBatches();
        } else {
          const errMsg = (result && result.data && result.data.error) ? result.data.error : 'Failed to save changes.';
          showCustomAlert(errMsg, 'Save Error', 'error');
        }
      } catch (err) {
        showCustomAlert(`Save error: ${err.message || err}`, 'Error', 'error');
      } finally {
        btnPortalUpdateSave.disabled = false;
        btnPortalUpdateSave.innerHTML = origText;
      }
    });
  }

  // Keydowns for serial input
  const serialInpField = document.getElementById('portal-update-serial-input');
  if (serialInpField) {
    serialInpField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('btn-portal-update-retrieve')?.click();
      }
    });
  }

  // Export Excel (from portal records)
  const btnPageExportExcel = document.getElementById('btn-page-export-excel');
  if (btnPageExportExcel) {
    btnPageExportExcel.addEventListener('click', () => {
      if (portalRecords.length === 0) { showCustomAlert('No records loaded. View a batch first.', 'Export', 'warn'); return; }
      const headers = 'Date,Serial Number,Product,CPU,RAM,SSD,Graphics,Battery,Windows Ver,Operator\n';
      const rows = portalRecords.map(r => {
        const s = r.specs || {};
        const esc = v => `"${String(v||'').replace(/"/g,'""')}"`;
        return [r.timestamp, s.serialNumber, s.productName, s.cpu, s.ram, s.ssd, s.graphics, s.battery, s.windowsVer, r.operator].map(esc).join(',');
      }).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `QC_${portalCurrentBatch}_Export.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showCustomAlert('CSV exported successfully.', 'Export', 'success');
    });
  }

  // Export PDF (from portal records)
  const btnPageExportPdf = document.getElementById('btn-page-export-pdf');
  if (btnPageExportPdf) {
    btnPageExportPdf.addEventListener('click', () => {
      if (btnPortalExportPdf) { btnPortalExportPdf.click(); return; }
      if (portalRecords.length === 0) { showCustomAlert('No records loaded.', 'Export', 'warn'); return; }
      const rows = portalRecords.map((r, i) => { const s = r.specs || {}; return `<tr><td>${i+1}</td><td>${new Date(r.timestamp).toLocaleString()}</td><td>${s.serialNumber||'N/A'}</td><td>${s.productName||'N/A'}</td><td>${s.cpu||'N/A'}</td><td>${s.ram||'N/A'}</td><td>${s.ssd||'N/A'}</td><td>${s.battery||'N/A'}</td><td>${r.operator||'N/A'}</td></tr>`; }).join('');
      const w = window.open('', '_blank', 'width=1100,height=800');
      if (w) {
        w.document.write(`<html><head><title>QC Report - ${portalCurrentBatch}</title><style>body{font-family:system-ui,sans-serif;padding:40px;color:#1e293b}.header{border-bottom:2px solid #3b82f6;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between}h1{font-size:22px;color:#2563eb;margin:0}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #e2e8f0;padding:9px}th{background:#f8fafc;font-weight:700;color:#475569}</style></head><body><div class="header"><div><h1>BC Elite QC</h1><p style="margin:4px 0 0;color:#64748b">Hardware Diagnostics Batch Report</p></div><div style="text-align:right;font-size:13px"><strong>Batch:</strong> ${portalCurrentBatch}<br><strong>Devices:</strong> ${portalRecords.length}<br><strong>Date:</strong> ${new Date().toLocaleDateString()}</div></div><table><thead><tr><th>#</th><th>Sync Date</th><th>Serial</th><th>Product</th><th>CPU</th><th>RAM</th><th>SSD</th><th>Battery</th><th>Operator</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
        w.document.close();
        w.onload = () => { w.print(); setTimeout(() => w.close(), 500); };
      }
    });
  }

  // =========================================================
  // REMEMBER ME CREDENTIALS SYNCHRONIZATION
  // =========================================================
  function saveOperatorRememberCredentials(username, password, isRemember) {
    if (isRemember) {
      localStorage.setItem('portal_remember', 'true');
      localStorage.setItem('portal_username', username);
      localStorage.setItem('portal_password', password);
    } else {
      localStorage.removeItem('portal_remember');
      localStorage.removeItem('portal_username');
      localStorage.removeItem('portal_password');
    }

    // Sync elements on both login layouts
    const pageUser = document.getElementById('page-portal-username');
    const pagePass = document.getElementById('page-portal-password');
    const pageCheckbox = document.getElementById('page-portal-remember');
    const modalUser = document.getElementById('portal-username');
    const modalPass = document.getElementById('portal-password');
    const modalCheckbox = document.getElementById('portal-remember');

    if (pageUser) pageUser.value = isRemember ? username : '';
    if (pagePass) pagePass.value = isRemember ? password : '';
    if (pageCheckbox) pageCheckbox.checked = isRemember;
    if (modalUser) modalUser.value = isRemember ? username : '';
    if (modalPass) modalPass.value = isRemember ? password : '';
    if (modalCheckbox) modalCheckbox.checked = isRemember;
  }

  async function loadRememberedCredentials() {
    const isRemember = localStorage.getItem('portal_remember') === 'true';
    if (isRemember) {
      const username = localStorage.getItem('portal_username') || '';
      const password = localStorage.getItem('portal_password') || '';

      const pageUser = document.getElementById('page-portal-username');
      const pagePass = document.getElementById('page-portal-password');
      const pageCheckbox = document.getElementById('page-portal-remember');
      const modalUser = document.getElementById('portal-username');
      const modalPass = document.getElementById('portal-password');
      const modalCheckbox = document.getElementById('portal-remember');

      if (pageUser) pageUser.value = username;
      if (pagePass) pagePass.value = password;
      if (pageCheckbox) pageCheckbox.checked = true;
      if (modalUser) modalUser.value = username;
      if (modalPass) modalPass.value = password;
      if (modalCheckbox) modalCheckbox.checked = true;

      if (username && password) {
        log(`Auto-authenticating operator "${username}"...`, 'info');
        try {
          const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
          const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';

          const response = await electronAPI.httpPost(`${apiUrl}/qc/auth`, { username, password }, token);

          if (response.success && response.data && response.data.success) {
            currentOperator = response.data.operator;
            log(`QC Operator Session Auto-Authorized: "${currentOperator}"`, 'ready');
            loadDatabasePortalView();
          } else {
            // Local fallback check
            const isLocalValid = (username.toLowerCase() === 'admin' || username.toLowerCase() === 'operator') && password === 'password';
            if (isLocalValid) {
              currentOperator = username;
              log(`QC Operator Session Auto-Authorized via Local Fallback: "${currentOperator}"`, 'ready');
              loadDatabasePortalView();
            } else {
              log(`Auto-authorization failed: Invalid stored credentials.`, 'warn');
            }
          }
        } catch (err) {
          log(`Auto-authorization error: ${err.message || err}`, 'error');
        }
      }
    }
  }

  // =========================================================
  // TOAST NOTIFICATIONS & COPY ON DOUBLE-CLICK
  // =========================================================
  function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.bottom = '50px';
      container.style.left = '50%';
      container.style.transform = 'translateX(-50%)';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '10px';
      container.style.zIndex = '9999';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.background = 'rgba(44, 44, 46, 0.85)';
    toast.style.backdropFilter = 'blur(12px)';
    toast.style.webkitBackdropFilter = 'blur(12px)';
    toast.style.color = '#ffffff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '24px';
    toast.style.fontSize = '12px';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
    toast.style.border = '1px solid rgba(255,255,255,0.08)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--color-green);"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-15px)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2200);
  }

  function bindSpecRowCopyEvents() {
    const specRows = document.querySelectorAll('#view-system-health .spec-row');
    specRows.forEach(row => {
      row.style.cursor = 'pointer';
      row.title = 'Double-click to copy to clipboard';

      row.addEventListener('dblclick', async () => {
        const labelEl = row.querySelector('.spec-label');
        const valueEl = row.querySelector('.spec-value');
        if (!labelEl || !valueEl) return;

        const label = labelEl.textContent.trim();
        const value = valueEl.textContent.trim();

        if (!value || value === 'Detecting...' || value === 'None') {
          log(`Cannot copy empty or loading details for "${label}"`, 'warn');
          return;
        }

        try {
          await navigator.clipboard.writeText(value);
          log(`Copied ${label} ("${value}") to clipboard.`, 'info');
          showToast(`${label} copied to clipboard!`);
        } catch (err) {
          log(`Failed to copy to clipboard: ${err.message}`, 'error');
        }
      });
    });
  }

  // Start initialization
  loadSettings();
  loadSpecifications();
  updateAppVersion();
  loadRememberedCredentials();
  bindSpecRowCopyEvents();

  // Hidden hotkey to toggle Database Portal tab: Shift + F6
  window.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'F6') {
      e.preventDefault();
      const navDb = document.getElementById('nav-database-portal');
      if (navDb) {
        if (navDb.style.display === 'none') {
          navDb.style.display = 'flex';
          log('Database Portal sidebar tab activated.', 'info');
          showToast('Database Portal Revealed!');
        } else {
          navDb.style.display = 'none';
          log('Database Portal sidebar tab hidden.', 'info');
          showToast('Database Portal Hidden!');
          
          // Switch view if current active tab is hidden
          if (navDb.classList.contains('active')) {
            const navSystem = document.getElementById('nav-system-health');
            if (navSystem) navSystem.click();
          }
        }
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
