// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
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

  const btnCreateTable = document.getElementById('btn-create-table');
  const btnViewTable = document.getElementById('btn-view-table');
  const btnSubmitServer = document.getElementById('btn-submit-server');
  const btnSearchMfg = document.getElementById('btn-search-mfg');

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

  // Basic spec fetchers
  async function fetchRamBasic() {
    try {
      const ramResult = await electronAPI.getSystemSpec(
        'Get-WmiObject Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum | ForEach-Object { "$([Math]::Round($_.Sum / 1GB)) GB" }'
      );
      if (ramResult.success && ramResult.data) {
        const totalRam = ramResult.data.trim();
        specRam.textContent = totalRam;
        systemSpecs.ram = totalRam;
        const detailRamTotal = document.getElementById('detail-ram-total');
        if (detailRamTotal) detailRamTotal.textContent = totalRam;
      } else {
        throw new Error('RAM query failed');
      }
    } catch (err) {
      await querySpec(
        "Get-WmiObject -Class Win32_ComputerSystem | Select-Object @{Name='RAM';Expression={'{0:N0} GB' -f ($_.TotalPhysicalMemory/1GB)}} | ft -HideTableHeaders",
        specRam,
        'ram',
        '8 GB'
      );
      const detailRamTotal = document.getElementById('detail-ram-total');
      if (detailRamTotal) detailRamTotal.textContent = systemSpecs.ram;
    }
    log(`System RAM: ${systemSpecs.ram}`, 'debug');
    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    if (cacheMode === 'permanently') {
      localStorage.setItem('qc_basic_specs', JSON.stringify(systemSpecs));
    }
  }

  async function fetchSsdBasic() {
    try {
      const ssdResult = await electronAPI.getSystemSpec(
        'Get-WmiObject -Class Win32_DiskDrive | Measure-Object -Property Size -Sum | ForEach-Object { [Math]::Round($_.Sum / 1GB) }'
      );
      if (ssdResult.success && ssdResult.data) {
        const totalGb = parseInt(ssdResult.data.trim(), 10);
        let displaySize = '';
        if (!isNaN(totalGb) && totalGb > 0) {
          if (totalGb >= 900) {
            displaySize = `${Math.round(totalGb / 1024 * 10) / 10} TB`;
          } else {
            displaySize = `${totalGb} GB`;
          }
        } else {
          displaySize = ssdResult.data.trim() + ' GB';
        }
        specSsd.textContent = displaySize;
        systemSpecs.ssd = displaySize;
        const detailSsdTotal = document.getElementById('detail-ssd-total');
        if (detailSsdTotal) detailSsdTotal.textContent = displaySize;
      } else {
        throw new Error('SSD Query empty');
      }
    } catch (err) {
      await querySpec(
        'Get-WmiObject -Class Win32_DiskDrive | Measure-Object -Property Size -Sum | ForEach-Object { "$([Math]::Round($_.Sum / 1GB)) GB" }',
        specSsd,
        'ssd',
        '256 GB'
      );
      const detailSsdTotal = document.getElementById('detail-ssd-total');
      if (detailSsdTotal) detailSsdTotal.textContent = systemSpecs.ssd;
    }
    log(`Disk Drive detected: ${systemSpecs.ssd}`, 'debug');
    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    if (cacheMode === 'permanently') {
      localStorage.setItem('qc_basic_specs', JSON.stringify(systemSpecs));
    }
  }

  async function fetchGraphicsBasic() {
    try {
      const gpuResult = await electronAPI.getSystemSpec(
        `Get-WmiObject -Class Win32_VideoController | Group-Object Name | ForEach-Object {
            $gpu = $_.Group[0]
            $name = $gpu.Name.Trim()
            $ram = $gpu.AdapterRAM
            if ($ram -lt 0) { $ram = [uint32]$ram }
            $gb = [Math]::Round($ram / 1GB)
            $isDedicated = ($name -match 'NVIDIA|GeForce|RTX|GTX|Quadro|Arc' -or ($name -match 'AMD|Radeon' -and $name -notmatch 'Radeon.*Graphics|Vega|Processor|Integrated'))
            if ($isDedicated -and $gb -gt 0) {
                "$name ($gb GB)"
            } else {
                $name
            }
        }`
      );
      if (gpuResult.success && gpuResult.data) {
        const gpus = gpuResult.data.split('\n').map(g => g.trim()).filter(g => g);
        if (gpus.length > 0) {
          const resGpus = gpus.join(' + ');
          specGraphics.textContent = resGpus;
          systemSpecs.graphics = resGpus;
          const detailGraphicsSummary = document.getElementById('detail-graphics-summary');
          if (detailGraphicsSummary) detailGraphicsSummary.textContent = resGpus;
        } else {
          throw new Error('GPU empty');
        }
      } else {
        throw new Error('GPU query failed');
      }
    } catch (err) {
      await querySpec(
        'Get-WmiObject -Class Win32_VideoController | Select-Object -ExpandProperty Name | Select-Object -First 1',
        specGraphics,
        'graphics',
        'Intel HD Graphics'
      );
      const detailGraphicsSummary = document.getElementById('detail-graphics-summary');
      if (detailGraphicsSummary) detailGraphicsSummary.textContent = systemSpecs.graphics;
    }
    log(`GPU detection: ${systemSpecs.graphics} active`, 'debug');
    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    if (cacheMode === 'permanently') {
      localStorage.setItem('qc_basic_specs', JSON.stringify(systemSpecs));
    }
  }

  async function fetchDisplayBasic() {
    try {
      const resResult = await electronAPI.getSystemSpec(
        `try {
            $vc = Get-WmiObject -Class Win32_VideoController | Where-Object { $_.CurrentHorizontalResolution -gt 0 } | Select-Object -First 1
            if ($vc) {
                "$($vc.CurrentHorizontalResolution) x $($vc.CurrentVerticalResolution)"
            } else {
                Add-Type -AssemblyName System.Windows.Forms
                $screen = [System.Windows.Forms.Screen]::PrimaryScreen
                "$($screen.Bounds.Width) x $($screen.Bounds.Height)"
            }
        } catch {
            "1920 x 1080"
        }`
      );
      if (resResult.success && resResult.data && resResult.data.includes('x')) {
        const parts = resResult.data.split('x').map(p => parseInt(p.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const width = parts[0];
          const height = parts[1];
          let label = '';
          if (width >= 3840 && height >= 2160) label = 'UHD';
          else if (width >= 2560 && height >= 1440) label = 'QHD';
          else if (width >= 1920 && height >= 1080) label = 'FHD';
          else if (width >= 1600 && height >= 900) label = 'HD+';
          else if (width >= 1280 && height >= 720) label = 'HD';

          const displayText = `${width} x ${height}${label ? ' ' + label : ''}`;
          specDisplay.textContent = displayText;
          systemSpecs.displayRes = displayText;
        } else {
          throw new Error('Invalid resolution parts');
        }
      } else {
        throw new Error('Resolution query failed');
      }
    } catch (e) {
      specDisplay.textContent = '1920 x 1080 FHD';
      systemSpecs.displayRes = '1920 x 1080 FHD';
    }
    log(`Display Resolution: ${systemSpecs.displayRes}`, 'debug');
    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    if (cacheMode === 'permanently') {
      localStorage.setItem('qc_basic_specs', JSON.stringify(systemSpecs));
    }
  }

  async function fetchWindowsBasic() {
    try {
      const winResult = await electronAPI.getSystemSpec(
        '(Get-WmiObject -Class Win32_OperatingSystem).Caption + " (Build " + (Get-WmiObject -Class Win32_OperatingSystem).BuildNumber + ")"'
      );
      if (winResult.success && winResult.data) {
        const cleanedWin = winResult.data.replace('Microsoft ', '').trim();
        specWindows.textContent = cleanedWin;
        systemSpecs.windowsVer = cleanedWin;
      } else {
        specWindows.textContent = 'Windows 11';
        systemSpecs.windowsVer = 'Windows 11';
      }
    } catch (e) {
      specWindows.textContent = 'Windows 11';
      systemSpecs.windowsVer = 'Windows 11';
    }
    log(`OS Version: ${systemSpecs.windowsVer}`, 'debug');
    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    if (cacheMode === 'permanently') {
      localStorage.setItem('qc_basic_specs', JSON.stringify(systemSpecs));
    }
  }

  async function fetchBatteryBasic() {
    try {
      const batResult = await electronAPI.getSystemSpec(
        `try {
            $xmlPath = "$env:TEMP\\battery_report_spec.xml"
            powercfg /batteryreport /xml /output $xmlPath | Out-Null
            if (Test-Path $xmlPath) {
                [xml]$xml = Get-Content $xmlPath
                $bat = $xml.BatteryReport.Batteries.Battery
                if ($bat) {
                    $design = [double]$bat.DesignCapacity
                    $full = [double]$bat.FullChargeCapacity
                    $cycles = $bat.CycleCount
                    if ($design -gt 0) {
                         $health = [Math]::Round(($full / $design) * 100)
                         "$health% ($cycles cycles)"
                    } else {
                        "N/A"
                    }
                } else {
                    "N/A"
                }
                Remove-Item $xmlPath -ErrorAction SilentlyContinue
            } else {
                "N/A"
            }
        } catch {
            "N/A"
        }`
      );
      if (batResult.success && batResult.data && batResult.data.trim() !== 'N/A') {
        const cleanData = batResult.data.trim();
        const match = cleanData.match(/(\d+)%/);
        if (match) {
          const percent = parseInt(match[1], 10);
          const status = getBatteryStatus(percent);
          const cyclesMatch = cleanData.match(/\(([^)]+)\)/);
          const cyclesStr = cyclesMatch ? ` (${cyclesMatch[1]})` : '';

          const specElement = document.getElementById('spec-battery-health');
          if (specElement) {
            specElement.className = 'spec-value';
            specElement.innerHTML = `<span style="color: ${status.color}; font-weight: 700;">${percent}% (${status.text})</span>${cyclesStr}`;
          }
          systemSpecs.battery = `${percent}% (${status.text})${cyclesStr}`;
        } else {
          const specElement = document.getElementById('spec-battery-health');
          if (specElement) specElement.textContent = cleanData;
          systemSpecs.battery = cleanData;
        }
      } else {
        const specElement = document.getElementById('spec-battery-health');
        if (specElement) specElement.textContent = 'N/A (Desktop)';
        systemSpecs.battery = 'N/A (Desktop)';
      }
    } catch (e) {
      const specElement = document.getElementById('spec-battery-health');
      if (specElement) specElement.textContent = 'N/A';
      systemSpecs.battery = 'N/A';
    }
    log(`Battery Status: ${systemSpecs.battery}`, 'debug');
    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    if (cacheMode === 'permanently') {
      localStorage.setItem('qc_basic_specs', JSON.stringify(systemSpecs));
    }
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

    const cachedBasic = cacheMode === 'permanently' ? localStorage.getItem('qc_basic_specs') : null;
    if (cachedBasic) {
      try {
        const specs = JSON.parse(cachedBasic);
        Object.assign(systemSpecs, specs);

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

        log('Loaded primary specifications from cache.', 'debug');

        // Detailed loaders in background (will load from cache instantly)
        Promise.all([
          loadDetailedRAM(false),
          loadDetailedSSD(false),
          loadDetailedGraphics(false),
          loadDetailedBattery(false)
        ]).then(() => {
          log('All detailed hardware specifications loaded from cache.', 'debug');
          log('Diagnostic modules loaded. Waiting for command input.', 'info');
          log('System Ready.', 'ready');
        }).catch(err => {
          log(`Error loading detailed hardware parameters: ${err.message}`, 'error');
          log('Diagnostic modules loaded. Waiting for command input.', 'info');
          log('System Ready.', 'ready');
        });

        return;
      } catch (e) {
        log('Error parsing basic specifications cache: ' + e.message, 'warn');
      }
    }

    // If cache not found or disabled, query all specs concurrently
    log('Pre-fetching detailed hardware configurations in parallel...', 'debug');

    const fetchBasicSpecs = async () => {
      const basicPromises = [];

      // 1. Product Name
      basicPromises.push(querySpec(
        'Get-WmiObject -Class Win32_ComputerSystemProduct | Select-Object -ExpandProperty Name',
        specProduct,
        'productName',
        'Generic Laptop'
      ).then(() => log(`Product detected: ${systemSpecs.productName}`, 'debug')));

      // 2. CPU
      basicPromises.push(querySpec(
        'Get-WmiObject -Class Win32_Processor | Select-Object -ExpandProperty Name',
        specCpu,
        'cpu',
        'Intel Core i7'
      ).then(() => log(`CPU detected: ${systemSpecs.cpu}`, 'debug')));

      // 3. RAM
      basicPromises.push(fetchRamBasic());

      // 4. SSD
      basicPromises.push(fetchSsdBasic());

      // 5. Graphics Card
      basicPromises.push(fetchGraphicsBasic());

      // 6. Display Resolution
      basicPromises.push(fetchDisplayBasic());

      // 7. Serial Number
      basicPromises.push(querySpec(
        'Get-WmiObject -Class Win32_BIOS | Select-Object -ExpandProperty SerialNumber',
        specSerial,
        'serialNumber',
        'PC1356548'
      ).then(() => log(`Serial Number: ${systemSpecs.serialNumber}`, 'debug')));

      // 8. Windows Version
      basicPromises.push(fetchWindowsBasic());

      // 9. Battery Health
      basicPromises.push(fetchBatteryBasic());

      await Promise.all(basicPromises);

      if (cacheMode === 'permanently') {
        localStorage.setItem('qc_basic_specs', JSON.stringify(systemSpecs));
      }
    };

    // Load basic and detailed concurrently
    Promise.all([
      fetchBasicSpecs(),
      loadDetailedRAM(false),
      loadDetailedSSD(false),
      loadDetailedGraphics(false),
      loadDetailedBattery(false)
    ]).then(() => {
      log('All detailed hardware specifications pre-fetched and cached successfully.', 'debug');
      log('Diagnostic modules loaded. Waiting for command input.', 'info');
      log('System Ready.', 'ready');
    }).catch(err => {
      log(`Error pre-fetching detailed hardware parameters: ${err.message}`, 'error');
      log('Diagnostic modules loaded. Waiting for command input.', 'info');
      log('System Ready.', 'ready');
    });
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

  // ACTION BUTTONS EVENTS

  // 1. Create Table (Generates CSV and saves to Desktop)
  btnCreateTable.addEventListener('click', async () => {
    log('Exporting diagnostics table...', 'info');
    const history = JSON.parse(localStorage.getItem('qc_history') || '[]');

    if (history.length === 0) {
      log('No diagnostic records to save. Run checks first!', 'warn');
      return;
    }

    const csvData = generateCsv(history);
    const fileName = `QC_Diagnostics_Report_${systemSpecs.serialNumber || 'Report'}.csv`;

    const result = await electronAPI.saveTableFile(csvData, fileName);
    if (result.success) {
      log(`Table exported and saved to Desktop: ${fileName}`, 'ready');
      showCustomAlert(`Report exported successfully to Desktop:\n${fileName}`, 'Export Successful', 'info');
    } else {
      log(`Failed to save table file: ${result.error}`, 'error');
    }
  });

  // 2. View Table (Displays records in a modern overlay)
  btnViewTable.addEventListener('click', () => {
    populateTableModal();
    modalOverlay.classList.add('open');
  });

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

  // 3. Submit to Server
  btnSubmitServer.addEventListener('click', async () => {
    log('Initiating battery diagnostics report generation...', 'info');

    // Disable button to prevent spamming
    btnSubmitServer.disabled = true;
    const originalText = btnSubmitServer.innerHTML;
    btnSubmitServer.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Uploading...</span>`;

    try {
      const batReport = await electronAPI.runBatteryDiagnostics();
      if (!batReport.success) {
        log(`Battery check failed: ${batReport.error}`, 'error');
        btnSubmitServer.disabled = false;
        btnSubmitServer.innerHTML = originalText;
        return;
      }

      log('Battery Report generated successfully at temp directory.', 'debug');
      log('Uploading report to Bizzcohub server...', 'info');

      // Upload battery report XML content to API using Powershell Invoke-RestMethod just like bat file
      const xmlPath = batReport.xmlPath;
      const uploadCmd = `$res = Invoke-RestMethod -Uri 'https://www.bizzcohub.com/api/battery-check' -Method Post -InFile '${xmlPath}' -ContentType 'text/xml'; $url = 'https://www.bizzcohub.com/resources/battery-status?reportId=' + $res.id; Start-Process $url; echo "UPLOADED_ID:$($res.id)"`;

      const uploadResult = await electronAPI.getSystemSpec(uploadCmd);
      if (uploadResult.success) {
        log('Data successfully synchronized with Bizz Co Hub server.', 'ready');
        log('Opened detailed battery status page in your default browser.', 'debug');
        saveRecordToHistory('Battery Sent');
      } else {
        log(`Server upload failed: ${uploadResult.error}. Saving offline.`, 'warn');
        saveRecordToHistory('Battery Saved (Offline)');
      }
    } catch (err) {
      log(`API connection error: ${err.message}`, 'error');
    } finally {
      btnSubmitServer.disabled = false;
      btnSubmitServer.innerHTML = originalText;
    }
  });

  // 4. Search MFG
  btnSearchMfg.addEventListener('click', () => {
    const serial = systemSpecs.serialNumber || '';
    const product = systemSpecs.productName || '';

    log(`Initiating MFG warranty search for: ${product} (${serial})`, 'info');

    let url = 'https://www.google.com';
    let brand = '';

    const lowerProduct = product.toLowerCase();
    if (lowerProduct.includes('hp') || lowerProduct.includes('hewlett')) {
      brand = 'HP';
      url = `https://support.hp.com/us-en/check-warranty`;
    } else if (lowerProduct.includes('lenovo') || lowerProduct.includes('thinkpad')) {
      brand = 'Lenovo';
      url = `https://pcsupport.lenovo.com/us/en/warranty-lookup`;
    } else if (lowerProduct.includes('dell')) {
      brand = 'Dell';
      url = `https://www.dell.com/support/home/en-us?app=warranty`;
    } else {
      brand = 'Generic';
      url = `https://www.google.com/search?q=${encodeURIComponent(product + ' ' + serial + ' warranty check')}`;
    }

    log(`Redirecting to ${brand} lookup database in default browser.`, 'debug');
    window.open(url, '_blank');
  });

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
  testHdSentinel.addEventListener('click', () => executeTest(testHdSentinel, 'HDSentinel.exe', 'Hard Disk Tester', 'HD Sentinel'));
  testLcd.addEventListener('click', () => executeTest(testLcd, 'LCD_checking.exe', 'LCD Tester', 'LCD Pixel Check'));
  testCpuz.addEventListener('click', () => executeTest(testCpuz, 'cpuz_x64.exe', 'Cpu Tester', 'CPU-Z Info'));
  testBattery.addEventListener('click', () => executeTest(testBattery, 'Battery_checking.exe', 'Battery Tester', 'Battery Diagnostics'));
  testKeyboard.addEventListener('click', () => executeTest(testKeyboard, 'Keyboard_checking.exe', 'Keyboard Tester', 'Keyboard matrix check'));
  testSound.addEventListener('click', () => executeTest(testSound, 'Sound_checking.mp4', 'Sound Tester', 'Audio Playback'));

  // AUTO RUN ALL
  async function runAllTests() {
    log('Starting full automated diagnostics sequence...', 'info');
    log('Checking diagnostic tools integrity...', 'debug');

    // Launch all executables in parallel, matching the batch file behaviour
    const tests = [
      { element: testHdSentinel, file: 'HDSentinel.exe', folder: 'Hard Disk Tester', name: 'HD Sentinel' },
      { element: testLcd, file: 'LCD_checking.exe', folder: 'LCD Tester', name: 'LCD Pixel Check' },
      { element: testCpuz, file: 'cpuz_x64.exe', folder: 'Cpu Tester', name: 'CPU-Z Info' },
      { element: testBattery, file: 'Battery_checking.exe', folder: 'Battery Tester', name: 'Battery Diagnostics' },
      { element: testKeyboard, file: 'Keyboard_checking.exe', folder: 'Keyboard Tester', name: 'Keyboard matrix check' },
      { element: testSound, file: 'Sound_checking.mp4', folder: 'Sound Tester', name: 'Audio Playback' }
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
    });
  }

  if (btnRefreshGraphics) {
    btnRefreshGraphics.addEventListener('click', async () => {
      log('Refreshing graphics specs...', 'info');
      await Promise.all([
        loadDetailedGraphics(true),
        fetchGraphicsBasic()
      ]);
    });
  }

  if (btnRefreshBatteryDetail) {
    btnRefreshBatteryDetail.addEventListener('click', async () => {
      log('Refreshing battery specs...', 'info');
      await Promise.all([
        loadDetailedBattery(true),
        fetchBatteryBasic()
      ]);
    });
  }

  // Detailed specification loaders with LocalStorage caching
  async function loadDetailedRAM(force = false) {
    const detailRamTotal = document.getElementById('detail-ram-total');
    const detailRamSlots = document.getElementById('detail-ram-slots');

    detailRamTotal.textContent = systemSpecs.ram || 'Detecting...';

    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    const cached = cacheMode !== 'temporary' ? localStorage.getItem('qc_detailed_ram') : null;
    if (cached && !force) {
      log('Loaded detailed RAM configuration from cache.', 'debug');
      renderRAMDetails(cached);
      return;
    }

    detailRamSlots.innerHTML = '<div class="spec-row"><span class="spec-label">Querying RAM slots details...</span></div>';

    try {
      const result = await electronAPI.getSystemSpec(
        'Get-WmiObject Win32_PhysicalMemory | ForEach-Object { "$($_.DeviceLocator.Trim())|$($_.Manufacturer.Trim())|$([Math]::Round($_.Capacity/1GB)) GB|$($_.Speed)MHz|$($_.PartNumber.Trim())|$($_.ConfiguredVoltage)mV" }'
      );

      if (result.success && result.data) {
        if (cacheMode !== 'temporary') {
          localStorage.setItem('qc_detailed_ram', result.data);
        }
        renderRAMDetails(result.data);
      } else {
        detailRamSlots.innerHTML = '<div class="spec-row"><span class="spec-label">No RAM slots detected or query failed.</span></div>';
      }
    } catch (err) {
      detailRamSlots.innerHTML = `<div class="spec-row"><span class="spec-label">Error: ${err.message}</span></div>`;
    }
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
    const detailSsdList = document.getElementById('detail-ssd-list');

    detailSsdTotal.textContent = systemSpecs.ssd || 'Detecting...';

    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    const cached = cacheMode !== 'temporary' ? localStorage.getItem('qc_detailed_ssd') : null;
    if (cached && !force) {
      log('Loaded detailed disk configuration from cache.', 'debug');
      renderSSDDetails(cached);
      return;
    }

    detailSsdList.innerHTML = '<div class="spec-row"><span class="spec-label">Querying drive parameters...</span></div>';

    try {
      const result = await electronAPI.getSystemSpec(
        `Get-WmiObject -Class Win32_DiskDrive | ForEach-Object {
            $disk = $_
            $mediaType = "Unknown"
            $health = "Unknown"
            $life = "N/A"
            
            # 1. Parse HDSentinel.sta database
            $staPath = "C:\\QC_Software\\Hard Disk Tester\\HDSentinel.sta"
            if (-not (Test-Path $staPath)) {
                $staPath = "HDSentinel.sta"
            }
            if (-not (Test-Path $staPath)) {
                $staPath = "F:\\Company Software\\QC Software\\HDSentinel.sta"
            }
            if (Test-Path $staPath) {
                $content = Get-Content $staPath
                $cleanSearchSerial = ($disk.SerialNumber -replace '[^A-Za-z0-9]', '').Trim()
                $sectionFound = $false
                $healthVal = $null
                foreach ($line in $content) {
                    $line = $line.Trim()
                    if ($line.StartsWith("[Sta_")) {
                        $cleanSectionName = ($line -replace '[^A-Za-z0-9]', '')
                        $isMatch = $false
                        if ($cleanSearchSerial -and $cleanSectionName.Contains($cleanSearchSerial)) {
                            $isMatch = $true
                        } elseif ($disk.Model -and ($cleanSectionName.Contains(($disk.Model -replace '[^A-Za-z0-9]', '')))) {
                            $isMatch = $true
                        }
                        if ($isMatch) {
                            $sectionFound = $true
                            continue
                        }
                    }
                    if ($sectionFound) {
                        if ($line.StartsWith("[")) { break }
                        if ($line -match "^\\d+=(.+)$") {
                            $vals = $matches[1].Split(',')
                            if ($vals.Count -ge 4) {
                                $healthVal = $vals[3].Trim()
                            }
                            break
                        }
                    }
                }
                if ($healthVal) {
                    $health = "$healthVal% Health"
                    $life = "$healthVal% Life Remaining"
                }
            }
            
            # 2. Get Media Type via CIM physical disk
            $phys = $null
            try {
                $phys = Get-PhysicalDisk | Where-Object { $_.Model -eq $disk.Model -or $_.DeviceId -eq [string]$disk.Index } -ErrorAction SilentlyContinue | Select-Object -First 1
            } catch {}
            if ($phys) {
                $mediaType = $phys.MediaType
                # If HDSentinel search failed, try Storage counters
                if ($health -eq "Unknown") {
                    $health = $phys.HealthStatus
                    try {
                        $counter = Get-StorageReliabilityCounter -PhysicalDisk $phys -ErrorAction Stop
                        if ($counter -and $counter.Wear -ne $null) {
                            $lifeVal = 100 - $counter.Wear
                            $life = "$lifeVal% Life Remaining"
                            $health = "$lifeVal% Health"
                        }
                    } catch {}
                }
            }
            "$($disk.Index)|$($disk.Model.Trim())|$([Math]::Round($disk.Size/1GB)) GB|$($disk.InterfaceType)|$($disk.SerialNumber.Trim())|$mediaType|$($disk.Partitions)|$health|$life"
        }`
      );

      if (result.success && result.data) {
        const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
        if (cacheMode !== 'temporary') {
          localStorage.setItem('qc_detailed_ssd', result.data);
        }
        renderSSDDetails(result.data);
      } else {
        detailSsdList.innerHTML = '<div class="spec-row"><span class="spec-label">No physical drives detected.</span></div>';
      }
    } catch (err) {
      detailSsdList.innerHTML = `<div class="spec-row"><span class="spec-label">Error: ${err.message}</span></div>`;
    }
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
    const detailGraphicsList = document.getElementById('detail-graphics-list');

    detailGraphicsSummary.textContent = systemSpecs.graphics || 'Detecting...';

    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    const cached = cacheMode !== 'temporary' ? localStorage.getItem('qc_detailed_graphics') : null;
    if (cached && !force) {
      log('Loaded detailed GPU configuration from cache.', 'debug');
      renderGraphicsDetails(cached);
      return;
    }

    detailGraphicsList.innerHTML = '<div class="spec-row"><span class="spec-label">Querying GPU engines...</span></div>';

    try {
      const result = await electronAPI.getSystemSpec(
        `Get-WmiObject -Class Win32_VideoController | Group-Object Name | ForEach-Object {
            $gpu = $_.Group[0]
            $name = $gpu.Name.Trim()
            $proc = $gpu.VideoProcessor
            $drv = $gpu.DriverVersion
            $ram = $gpu.AdapterRAM
            if ($ram -lt 0) { $ram = [uint32]$ram }
            $gb = [Math]::Round($ram / 1GB)
            
            $res = "$($gpu.CurrentHorizontalResolution) x $($gpu.CurrentVerticalResolution)"
            $ref = "$($gpu.CurrentRefreshRate) Hz"
            
            "$name|$proc|$drv|$gb GB|$res|$ref"
        }`
      );

      if (result.success && result.data) {
        const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
        if (cacheMode !== 'temporary') {
          localStorage.setItem('qc_detailed_graphics', result.data);
        }
        renderGraphicsDetails(result.data);
      } else {
        detailGraphicsList.innerHTML = '<div class="spec-row"><span class="spec-label">No graphics adapters detected.</span></div>';
      }
    } catch (err) {
      detailGraphicsList.innerHTML = `<div class="spec-row"><span class="spec-label">Error: ${err.message}</span></div>`;
    }
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
    const detailBatteryList = document.getElementById('detail-battery-list');

    const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
    const cached = cacheMode !== 'temporary' ? localStorage.getItem('qc_detailed_battery') : null;
    if (cached && !force) {
      log('Loaded detailed battery configuration from cache.', 'debug');
      renderBatteryDetails(cached);
      return;
    }

    detailBatteryList.innerHTML = '<div class="spec-row"><span class="spec-label">Querying detailed battery parameters...</span></div>';

    try {
      const result = await electronAPI.getSystemSpec(
        `try {
            $xmlPath = "$env:TEMP\\battery_report_detail.xml"
            powercfg /batteryreport /xml /output $xmlPath | Out-Null
            if (Test-Path $xmlPath) {
                [xml]$xml = Get-Content $xmlPath
                $bat = $xml.BatteryReport.Batteries.Battery
                if ($bat) {
                    $mfg = $bat.Manufacturer.Trim()
                    $serial = $bat.SerialNumber.Trim()
                    $chem = $bat.Chemistry.Trim()
                    $design = $bat.DesignCapacity
                    $full = $bat.FullChargeCapacity
                    $cycles = $bat.CycleCount
                    
                    $status = Get-CimInstance -Namespace root\wmi -ClassName BatteryStatus -ErrorAction SilentlyContinue
                    $volt = if ($status) { $status.Voltage } else { 0 }
                    
                    "$mfg|$serial|$chem|$design|$full|$cycles|$volt"
                } else {
                    "N/A"
                }
                Remove-Item $xmlPath -ErrorAction SilentlyContinue
            } else {
                "N/A"
            }
        } catch {
            "N/A"
        }`
      );

      if (result.success && result.data && result.data.trim() !== 'N/A') {
        const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
        if (cacheMode !== 'temporary') {
          localStorage.setItem('qc_detailed_battery', result.data);
        }
        renderBatteryDetails(result.data);
      } else {
        detailBatteryList.innerHTML = '<div class="spec-row"><span class="spec-label">No battery detected or query failed (Desktop system).</span></div>';
      }
    } catch (err) {
      detailBatteryList.innerHTML = `<div class="spec-row"><span class="spec-label">Error: ${err.message}</span></div>`;
    }
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
      const apiUrl = document.getElementById('setting-api-url')?.value || '';
      const apiToken = document.getElementById('setting-api-token')?.value || '';
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


  // Support Ticket Action
  const btnSupportTicket = document.getElementById('btn-support-ticket');
  if (btnSupportTicket) {
    btnSupportTicket.addEventListener('click', () => {
      log('Opening support contact page in default browser...', 'info');
      window.open('https://www.bizzcohub.com/contact', '_blank');
    });
  }

  // Start initialization
  loadSettings();
  loadSpecifications();
  updateAppVersion();
});
