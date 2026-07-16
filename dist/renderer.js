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

  // Custom device formatting rules helpers
  function formatProductName(mfg, model, name) {
    let brand = (mfg || '').trim();
    let fullModel = (model || name || '').trim();

    if (/hewlett-packard|hp/i.test(brand)) brand = 'HP';
    else if (/dell/i.test(brand)) brand = 'Dell';
    else if (/lenovo/i.test(brand)) brand = 'Lenovo';
    else if (/asus/i.test(brand)) brand = 'ASUS';
    else if (/acer/i.test(brand)) brand = 'Acer';
    else if (/apple/i.test(brand)) brand = 'Apple';
    else if (/microsoft/i.test(brand)) brand = 'Microsoft';
    else if (/gigabyte/i.test(brand)) brand = 'Gigabyte';
    else if (/msi/i.test(brand)) brand = 'MSI';
    else {
      brand = brand.split(' ')[0] || 'Generic';
    }

    let modelClean = fullModel;
    const brandRegex = new RegExp(`^${brand}\\s+`, 'i');
    modelClean = modelClean.replace(brandRegex, '');

    let series = '';
    const seriesList = [
      'EliteBook', 'ProBook', 'Pavilion', 'Spectre', 'Envy', 'ZBook', 'Omen', 'Victus',
      'Latitude', 'Inspiron', 'XPS', 'Vostro', 'Precision', 'Alienware', 'G-Series',
      'ThinkPad', 'Yoga', 'IdeaPad', 'Legion', 'ThinkBook',
      'ROG', 'TUF', 'ZenBook', 'Vivobook',
      'Aspire', 'Predator', 'Nitro', 'Swift', 'Spin'
    ];

    for (const s of seriesList) {
      const sRegex = new RegExp(s, 'i');
      if (sRegex.test(modelClean)) {
        series = s;
        modelClean = modelClean.replace(new RegExp(`\\s*${s}\\s*`, 'i'), ' ').trim();
        break;
      }
    }

    if (!series) {
      const words = modelClean.split(' ');
      if (words.length > 1) {
        series = words[0];
        modelClean = words.slice(1).join(' ');
      } else {
        series = 'Laptop';
      }
    }

    modelClean = modelClean.replace(/\s+/g, ' ').trim();
    if (!modelClean) modelClean = 'Model';

    return `${brand} > ${series} > ${modelClean}`;
  }

  function formatCpuCore(cpuName) {
    const match = cpuName.match(/(i[3579]|Ultra\s*[3579]|Ryzen\s*[3579])/i);
    if (match) {
      const core = match[1];
      return `Intel Core ${core}`;
    }
    return `Intel Core i7`;
  }

  function formatCpuGen(cpuName) {
    const match = cpuName.match(/(?:i[3579]|Ryzen\s*[3579])-(\d+)/i);
    if (match) {
      const numStr = match[1];
      let gen = '';
      if (numStr.length >= 5) {
        gen = numStr.substring(0, 2);
      } else if (numStr.length === 4) {
        if (numStr.startsWith('10')) {
          gen = '10';
        } else {
          gen = numStr.substring(0, 1);
        }
      } else {
        gen = numStr.substring(0, 1);
      }
      return `${gen}th gen`;
    }
    return `11th gen`;
  }

  function parseRAMDetails(detailedRam) {
    if (!detailedRam) return '';
    const slots = detailedRam.split('\n').filter(Boolean);
    const formattedSlots = slots.map(slot => {
      const parts = slot.split('|');
      if (parts.length >= 4) {
        const mfg = parts[1].trim();
        const cap = parts[2].trim().replace(/\s+/g, '');
        const speed = parts[3].trim();
        return `${mfg} ${cap} ${speed}`;
      }
      return '';
    }).filter(Boolean);
    return formattedSlots.join(' + ');
  }

  function parseSSDDetails(detailedSsd) {
    if (!detailedSsd) return '';
    const disks = detailedSsd.split('\n').filter(Boolean);
    const formattedDisks = disks.map(disk => {
      const parts = disk.split('|');
      if (parts.length >= 3) {
        const model = parts[1].trim();
        const rawSize = parseInt(parts[2].replace(/[^\d]/g, ''), 10);
        let sizeStr = parts[2].trim().replace(/\s+/g, '');
        if (rawSize >= 900) {
          sizeStr = '2TB';
        } else if (rawSize >= 450 && rawSize <= 512) {
          sizeStr = '512GB';
        } else if (rawSize >= 220 && rawSize <= 256) {
          sizeStr = '256GB';
        } else if (rawSize >= 110 && rawSize <= 128) {
          sizeStr = '128GB';
        }
        return `${model} ${sizeStr}`;
      }
      return '';
    }).filter(Boolean);
    return formattedDisks.join(' + ');
  }

  function parseGraphicsDetails(detailedGraphics) {
    if (!detailedGraphics) return '';
    const gpus = detailedGraphics.split('\n').filter(Boolean);
    let integratedList = [];
    let dedicatedList = [];

    gpus.forEach(gpu => {
      const parts = gpu.split('|');
      if (parts.length >= 4) {
        const name = parts[0].trim();
        const vram = parts[3].trim().replace(/\s+/g, '');
        const isDedicated = /nvidia|geforce|rtx|gtx|quadro|radeon\s*rx/i.test(name) && !/integrated|uhd|vega|processor/i.test(name);
        if (isDedicated) {
          dedicatedList.push(`${name} (${vram})`);
        } else {
          integratedList.push(`${name} (${vram})`);
        }
      }
    });

    let resultParts = [];
    if (integratedList.length > 0) resultParts.push(`Integrated: ${integratedList.join(' + ')}`);
    if (dedicatedList.length > 0) resultParts.push(`Dedicated: ${dedicatedList.join(' + ')}`);
    return resultParts.join(' | ');
  }

  function formatDisplayRes(resStr) {
    const clean = resStr.replace(/\s+/g, '');
    if (clean === '1920x1080') return '1920x1080 FHD';
    if (clean === '1366x768') return '1366x768 HD';
    if (clean === '2560x1440') return '2560x1440 QHD';
    if (clean === '3840x2160') return '3840x2160 4K UHD';
    return clean;
  }

  function parseBatteryDetails(detailedBattery, batteryBasic) {
    if (!detailedBattery || detailedBattery === 'N/A') return 'N/A';
    const parts = detailedBattery.split('|');
    if (parts.length >= 6) {
      const mfg = parts[0].trim();
      const serial = parts[1].trim();
      const cycles = parts[5].trim();
      const design = parseFloat(parts[3]);
      const full = parseFloat(parts[4]);
      let health = 100;
      if (design > 0) {
        health = Math.round((full / design) * 100);
      }
      return `${mfg}, Serial: ${serial}, Health: ${health}%, Cycles: ${cycles}`;
    }
    return batteryBasic || 'N/A';
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
try { $specs.manufacturer = (Get-WmiObject -Class Win32_ComputerSystem -ErrorAction SilentlyContinue).Manufacturer.Trim() } catch { $specs.manufacturer = "" }
try { $specs.model = (Get-WmiObject -Class Win32_ComputerSystem -ErrorAction SilentlyContinue).Model.Trim() } catch { $specs.model = "" }
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
          
          // Apply custom device formatting rules
          systemSpecs.productName = formatProductName(data.manufacturer, data.model, data.productName);
          
          const coreType = formatCpuCore(data.cpu || '');
          const genType = formatCpuGen(data.cpu || '');
          systemSpecs.cpu = `${coreType} - ${genType}`;
          
          systemSpecs.ram = parseRAMDetails(data.detailed_ram) || data.ram || '8 GB';
          systemSpecs.ssd = parseSSDDetails(data.detailed_ssd) || data.ssd || '256 GB';
          systemSpecs.graphics = parseGraphicsDetails(data.detailed_graphics) || data.graphics || 'Intel HD Graphics';
          systemSpecs.displayRes = formatDisplayRes(data.displayRes || '1920 x 1080 FHD');
          systemSpecs.serialNumber = data.serialNumber || 'PC1356548';
          systemSpecs.windowsVer = data.windowsVer || 'Windows 11';
          systemSpecs.battery = parseBatteryDetails(data.detailed_battery, data.battery) || data.battery || 'N/A';

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

  // 2. DETAILS UPLOAD (Opens login portal and controls database operations)
  if (btnDetailsUpload) {
    btnDetailsUpload.addEventListener('click', () => {
      if (!systemSpecs.serialNumber) {
        log('Diagnostics must be completed before database upload.', 'warn');
        showCustomAlert('Please wait for hardware detection to populate metrics before uploading.', 'Upload Interrupted', 'warn');
        return;
      }

      const navDbPortal = document.getElementById('nav-database-portal');
      if (navDbPortal) {
        navDbPortal.click();
      }
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

  // PORTAL CREATE BATCH & UPLOAD ACTION
  if (btnPortalCreateBatch) {
    btnPortalCreateBatch.addEventListener('click', async () => {
      const batchCode = prompt("Enter Batch Code to assign and upload specs:");
      if (batchCode === null) {
        log('Database upload aborted by operator.', 'info');
        return;
      }

      const cleanBatchCode = batchCode.trim();
      if (!cleanBatchCode) {
        log('Validation error: Upload requires a valid Batch Code.', 'warn');
        showCustomAlert('A valid Batch Code must be provided to categorize uploaded devices.', 'Validation Error', 'warn');
        return;
      }

      log(`Initiating database synchronization under batch: ${cleanBatchCode}...`, 'info');
      btnPortalCreateBatch.disabled = true;
      const originalBtnText = btnPortalCreateBatch.innerHTML;
      btnPortalCreateBatch.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;

      // Package specs including the authenticated operator name
      const payload = {
        batchCode: cleanBatchCode,
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        operator: currentOperator,
        specs: {
          ...systemSpecs,
          operator: currentOperator
        }
      };

      try {
        const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
        const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';
        
        const result = await electronAPI.httpPost(`${apiUrl}/upload-details`, payload, token);

        if (result.success) {
          log(`Operator "${currentOperator}" uploaded specifications under batch: ${cleanBatchCode}`, 'ready');
          showCustomAlert(`Product specifications logged under Batch: ${cleanBatchCode}`, 'Upload Success', 'success');
          saveRecordToHistory(`Uploaded to ${cleanBatchCode} (by ${currentOperator})`);
          
          // Close portal upon successful upload
          uploadPortalModal.classList.remove('open');
          setTimeout(() => { uploadPortalModal.style.display = 'none'; }, 300);
        } else {
          throw new Error(result.error || 'Unknown server error');
        }
      } catch (err) {
        log(`Database synchronization fault: ${err.message}`, 'error');
        showCustomAlert(`Unable to sync data with the database:\n${err.message}`, 'Sync Failure', 'error');
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

  // =========================================================
  // DATABASE PORTAL PAGE ACTION WORKFLOWS
  // =========================================================
  let activeBatchCode = '';

  function loadDatabasePortalView() {
    const pageLoginSection = document.getElementById('page-portal-login-section');
    const pageDashboardSection = document.getElementById('page-portal-dashboard-section');
    const pageLoggedUser = document.getElementById('page-portal-logged-user');
    const pageActiveBatch = document.getElementById('page-portal-active-batch');

    if (currentOperator) {
      if (pageLoggedUser) pageLoggedUser.textContent = currentOperator;
      if (pageActiveBatch) pageActiveBatch.textContent = activeBatchCode || 'None (Create/Assign below)';
      if (pageLoginSection) pageLoginSection.style.display = 'none';
      if (pageDashboardSection) pageDashboardSection.style.display = 'block';
    } else {
      if (pageLoginSection) pageLoginSection.style.display = 'block';
      if (pageDashboardSection) pageDashboardSection.style.display = 'none';
      const userField = document.getElementById('page-portal-username');
      const passField = document.getElementById('page-portal-password');
      const errField = document.getElementById('page-portal-login-error');
      if (userField) userField.value = '';
      if (passField) passField.value = '';
      if (errField) errField.style.display = 'none';
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

  const btnPageCreateBatch = document.getElementById('btn-page-create-batch');
  if (btnPageCreateBatch) {
    btnPageCreateBatch.addEventListener('click', () => {
      const batchCode = prompt("Enter Batch Code to create and assign:");
      if (batchCode === null) return;

      const cleanBatchCode = batchCode.trim();
      if (!cleanBatchCode) {
        showCustomAlert('A valid Batch Code must be provided.', 'Validation Error', 'warn');
        return;
      }

      activeBatchCode = cleanBatchCode;
      const pageActiveBatch = document.getElementById('page-portal-active-batch');
      if (pageActiveBatch) pageActiveBatch.textContent = activeBatchCode;
      log(`Active batch assigned: "${activeBatchCode}"`, 'info');
      showCustomAlert(`Active batch set to: ${activeBatchCode}`, 'Batch Created', 'success');
    });
  }

  const btnPageUploadDetails = document.getElementById('btn-page-upload-details');
  if (btnPageUploadDetails) {
    btnPageUploadDetails.addEventListener('click', async () => {
      if (!systemSpecs.serialNumber) {
        showCustomAlert('Diagnostics must be completed before database upload.', 'Upload Error', 'warn');
        return;
      }

      if (!activeBatchCode) {
        const batchCode = prompt("Enter Batch Code to assign and upload specs:");
        if (batchCode === null) return;
        const cleanBatchCode = batchCode.trim();
        if (!cleanBatchCode) {
          showCustomAlert('A valid Batch Code must be provided to upload.', 'Validation Error', 'warn');
          return;
        }
        activeBatchCode = cleanBatchCode;
        const pageActiveBatch = document.getElementById('page-portal-active-batch');
        if (pageActiveBatch) pageActiveBatch.textContent = activeBatchCode;
      }

      // Read issue found fields
      const issueCheckbox = document.getElementById('page-issue-checkbox');
      const isIssue = issueCheckbox ? issueCheckbox.checked : false;
      let issueSection = '';
      let issueDescription = '';

      if (isIssue) {
        const sectionSelect = document.getElementById('page-issue-section');
        const descTextarea = document.getElementById('page-issue-description');
        issueSection = sectionSelect ? sectionSelect.value : '';
        issueDescription = descTextarea ? descTextarea.value.trim() : '';

        if (!issueSection) {
          showCustomAlert('Please select the laptop part/section where the issue is located.', 'Validation Error', 'warn');
          return;
        }
      }

      log(`Uploading specifications to database under batch: ${activeBatchCode}...`, 'info');
      btnPageUploadDetails.disabled = true;
      const originalBtnText = btnPageUploadDetails.innerHTML;
      btnPageUploadDetails.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;

      // Guarantee the user's latest edited product name is saved
      if (specProduct) {
        systemSpecs.productName = specProduct.textContent.trim();
      }

      const payload = {
        batchCode: activeBatchCode,
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        operator: currentOperator,
        specs: {
          ...systemSpecs,
          operator: currentOperator,
          issueFound: isIssue,
          issueSection: issueSection,
          issueDescription: issueDescription
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

          // Reset issue inputs on success
          if (issueCheckbox) issueCheckbox.checked = false;
          const issueFields = document.getElementById('page-issue-fields');
          if (issueFields) issueFields.style.display = 'none';
          const sectionSelect = document.getElementById('page-issue-section');
          if (sectionSelect) sectionSelect.value = '';
          const descTextarea = document.getElementById('page-issue-description');
          if (descTextarea) descTextarea.value = '';
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
        btnPageUploadDetails.disabled = false;
        btnPageUploadDetails.innerHTML = originalBtnText;
      }
    });
  }

  // Toggle issue log fields display
  const pageIssueCheckbox = document.getElementById('page-issue-checkbox');
  if (pageIssueCheckbox) {
    pageIssueCheckbox.addEventListener('change', () => {
      const issueFields = document.getElementById('page-issue-fields');
      if (issueFields) {
        issueFields.style.display = pageIssueCheckbox.checked ? 'flex' : 'none';
      }
    });
  }

  // Bind input handler to save manual edits to the Product Name field
  if (specProduct) {
    specProduct.addEventListener('input', () => {
      systemSpecs.productName = specProduct.textContent.trim();
      const cacheMode = localStorage.getItem('setting_cache_mode') || 'permanently';
      if (cacheMode === 'permanently') {
        localStorage.setItem('qc_basic_specs', JSON.stringify(systemSpecs));
      }
    });
  }

  const btnPageViewHistory = document.getElementById('btn-page-view-history');
  if (btnPageViewHistory) {
    btnPageViewHistory.addEventListener('click', () => {
      if (btnViewUploadTable) {
        if (activeBatchCode && inputSearchBatchCode) {
          inputSearchBatchCode.value = activeBatchCode;
        }
        btnViewUploadTable.click();
        if (activeBatchCode && btnSearchBatch) {
          btnSearchBatch.click();
        }
      }
    });
  }

  const btnPageUpdateDetails = document.getElementById('btn-page-update-details');
  if (btnPageUpdateDetails) {
    btnPageUpdateDetails.addEventListener('click', async () => {
      btnPageUpdateDetails.disabled = true;
      const originalText = btnPageUpdateDetails.innerHTML;
      btnPageUpdateDetails.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...`;

      log('Re-running diagnostic discovery to update specifications...', 'info');
      await fetchAllSpecs(true);

      btnPageUpdateDetails.disabled = false;
      btnPageUpdateDetails.innerHTML = originalText;
      showCustomAlert('System specs updated successfully.', 'Details Refreshed', 'success');
    });
  }

  const btnPageExportExcel = document.getElementById('btn-page-export-excel');
  if (btnPageExportExcel) {
    btnPageExportExcel.addEventListener('click', () => {
      if (btnPortalExportExcel) btnPortalExportExcel.click();
    });
  }

  const btnPageExportPdf = document.getElementById('btn-page-export-pdf');
  if (btnPageExportPdf) {
    btnPageExportPdf.addEventListener('click', () => {
      if (btnPortalExportPdf) btnPortalExportPdf.click();
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

  function loadRememberedCredentials() {
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
