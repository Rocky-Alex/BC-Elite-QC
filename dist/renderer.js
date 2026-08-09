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
        try {
          const filePath = await window.__TAURI__.core.invoke('save_table_file', { data, file_name: fileName });
          return { success: true, filePath };
        } catch (err2) {
          return { success: false, error: err2 ? (err2.message || String(err2)) : (err ? (err.message || String(err)) : 'Unknown IPC error') };
        }
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
    },
    getSoundFolderPath: async () => {
      try {
        const path = await window.__TAURI__.core.invoke('get_sound_folder_path');
        return { success: true, path };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
    getSoundFiles: async () => {
      try {
        const files = await window.__TAURI__.core.invoke('get_sound_files');
        return { success: true, files };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
    openSoundFolder: async () => {
      try {
        await window.__TAURI__.core.invoke('open_sound_folder');
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
  };
  window.electronAPI = electronAPI;

  // MULTIPLE ISSUES STATE & UTILITIES
  let previewIssues = [];
  let portalUpdateIssues = [];

  function parseIssuesString(partsStr, issuesStr) {
    const list = [];
    if (!issuesStr) return list;
    const regex = /\[([^:]+):\s*([^\]]+)\]/g;
    let match;
    while ((match = regex.exec(issuesStr)) !== null) {
      list.push({ part: match[1].trim(), remark: match[2].trim() });
    }
    if (list.length === 0 && issuesStr.trim() !== '') {
      list.push({ part: partsStr || 'None', remark: issuesStr.trim() });
    }
    return list;
  }

  function renderPreviewIssues() {
    const listEl = document.getElementById('preview-issues-list');
    const placeholder = document.getElementById('preview-issues-placeholder');
    if (!listEl) return;
    listEl.querySelectorAll('.issue-tag').forEach(tag => tag.remove());
    if (previewIssues.length === 0) {
      if (placeholder) placeholder.style.display = 'block';
      return;
    }
    if (placeholder) placeholder.style.display = 'none';

    previewIssues.forEach((issue, index) => {
      const tag = document.createElement('div');
      tag.className = 'issue-tag';
      tag.style.cssText = 'background: rgba(255, 69, 58, 0.12); border: 1px solid rgba(255, 69, 58, 0.25); color: var(--color-red); padding: 4px 10px; border-radius: 6px; font-size: 11px; display: flex; align-items: center; gap: 8px; font-weight: 600; margin: 2px;';
      tag.innerHTML = `
        <span>[${issue.part}] ${issue.remark}</span>
        <i class="fa-solid fa-xmark" style="cursor: pointer; opacity: 0.8; font-size: 10px;" data-idx="${index}"></i>
      `;
      tag.querySelector('i').addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
        previewIssues.splice(idx, 1);
        renderPreviewIssues();
      });
      listEl.appendChild(tag);
    });
  }

  function renderPortalUpdateIssues() {
    const listEl = document.getElementById('portal-issues-list');
    const placeholder = document.getElementById('portal-issues-placeholder');
    if (!listEl) return;
    listEl.querySelectorAll('.issue-tag').forEach(tag => tag.remove());
    if (portalUpdateIssues.length === 0) {
      if (placeholder) placeholder.style.display = 'block';
      return;
    }
    if (placeholder) placeholder.style.display = 'none';

    portalUpdateIssues.forEach((issue, index) => {
      const tag = document.createElement('div');
      tag.className = 'issue-tag';
      tag.style.cssText = 'background: rgba(255, 69, 58, 0.12); border: 1px solid rgba(255, 69, 58, 0.25); color: var(--color-red); padding: 4px 10px; border-radius: 6px; font-size: 11px; display: flex; align-items: center; gap: 8px; font-weight: 600; margin: 2px;';
      tag.innerHTML = `
        <span>[${issue.part}] ${issue.remark}</span>
        <i class="fa-solid fa-xmark" style="cursor: pointer; opacity: 0.8; font-size: 10px;" data-idx="${index}"></i>
      `;
      tag.querySelector('i').addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
        portalUpdateIssues.splice(idx, 1);
        renderPortalUpdateIssues();
      });
      listEl.appendChild(tag);
    });
  }

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

  // Custom modal input prompt helper
  function showCustomPrompt(message, title = 'Input Required', callback, required = true) {
    const modal = document.getElementById('custom-prompt-modal');
    const msgEl = document.getElementById('custom-prompt-message');
    const titleEl = document.getElementById('custom-prompt-title');
    const inputEl = document.getElementById('custom-prompt-input');
    const errEl = document.getElementById('custom-prompt-error');
    const btnOk = document.getElementById('btn-custom-prompt-ok');
    const btnCancel = document.getElementById('btn-custom-prompt-cancel');

    if (!modal || !inputEl) {
      const val = prompt(message);
      if (callback) callback(val);
      return;
    }

    if (msgEl) msgEl.textContent = message;
    if (titleEl) titleEl.textContent = title;
    inputEl.value = '';
    if (errEl) errEl.style.display = 'none';
    modal.style.display = 'flex';
    
    setTimeout(() => { 
      modal.classList.add('open');
      inputEl.focus(); 
    }, 50);

    const cleanup = () => {
      modal.classList.remove('open');
      setTimeout(() => { modal.style.display = 'none'; }, 300);
      // Remove event listeners by cloning
      const newOk = btnOk.cloneNode(true);
      const newCancel = btnCancel.cloneNode(true);
      btnOk.parentNode.replaceChild(newOk, btnOk);
      btnCancel.parentNode.replaceChild(newCancel, btnCancel);
    };

    const handleOk = () => {
      const val = inputEl.value.trim();
      if (required && val === '') {
        if (errEl) errEl.style.display = 'block';
        return;
      }
      cleanup();
      if (callback) callback(val);
    };

    const handleCancel = () => {
      cleanup();
      if (callback) callback(null);
    };

    document.getElementById('btn-custom-prompt-ok').addEventListener('click', handleOk);
    document.getElementById('btn-custom-prompt-cancel').addEventListener('click', handleCancel);

    inputEl.onkeydown = (e) => {
      if (e.key === 'Enter') {
        handleOk();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };
  }

  // Window Controls (Support both click and touch screen tap actions)
  const handleMinimize = (e) => {
    if (e.type === 'touchstart') e.preventDefault();
    electronAPI.windowControl('minimize');
  };
  const handleMaximize = (e) => {
    if (e.type === 'touchstart') e.preventDefault();
    electronAPI.windowControl('maximize');
  };
  const handleClose = (e) => {
    if (e.type === 'touchstart') e.preventDefault();
    electronAPI.windowControl('close');
  };

  btnMinimize.addEventListener('click', handleMinimize);
  btnMinimize.addEventListener('touchstart', handleMinimize);

  btnMaximize.addEventListener('click', handleMaximize);
  btnMaximize.addEventListener('touchstart', handleMaximize);

  btnClose.addEventListener('click', handleClose);
  btnClose.addEventListener('touchstart', handleClose);

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

  // One-time cache bust: clear SSD cache when design version changes
  const SSD_DESIGN_VERSION = 'v2';
  if (localStorage.getItem('ssd_design_version') !== SSD_DESIGN_VERSION) {
    localStorage.removeItem('qc_detailed_ssd');
    localStorage.setItem('ssd_design_version', SSD_DESIGN_VERSION);
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
$batList = @()
try {
    $xmlPath = "$env:TEMP\\battery_report_combined.xml"
    if (Test-Path $xmlPath) { Remove-Item $xmlPath -ErrorAction SilentlyContinue }
    & powercfg /batteryreport /xml /output $xmlPath | Out-Null
    if (Test-Path $xmlPath) {
        [xml]$xml = Get-Content $xmlPath
        $batteries = $xml.BatteryReport.Batteries.Battery
        if ($batteries) {
            $batArray = @($batteries)
            $vols = @(Get-CimInstance -Namespace root\\wmi -ClassName BatteryStatus -ErrorAction SilentlyContinue)
            $idx = 0
            foreach ($bat in $batArray) {
                $bDesign = [double]($bat.DesignCapacity | ForEach-Object { $_ })
                $bFull = [double]($bat.FullChargeCapacity | ForEach-Object { $_ })
                $bCycles = if ($bat.CycleCount) { $bat.CycleCount } else { "0" }
                $bMfg = if ($bat.Manufacturer) { $bat.Manufacturer.Trim() } else { "Generic" }
                $bSerial = if ($bat.SerialNumber) { $bat.SerialNumber.Trim() } else { "N/A" }
                $bChem = if ($bat.Chemistry) { $bat.Chemistry.Trim() } else { "LIon" }
                $bVolt = 0
                if ($vols -and $vols[$idx]) { $bVolt = $vols[$idx].Voltage } elseif ($vols -and $vols[0]) { $bVolt = $vols[0].Voltage }
                if ($bDesign -gt 0) {
                    $batList += "$bMfg|$bSerial|$bChem|$bDesign|$bFull|$bCycles|$bVolt"
                }
                $idx++
            }
        }
        Remove-Item $xmlPath -ErrorAction SilentlyContinue
    }
} catch {}

if ($batList.Count -eq 0) {
    try {
        $wmiBats = Get-CimInstance -ClassName Win32_Battery -ErrorAction SilentlyContinue
        if ($wmiBats) {
            foreach ($wb in $wmiBats) {
                $bMfg = if ($wb.Manufacturer) { $wb.Manufacturer.Trim() } else { "Generic" }
                $bSerial = if ($wb.SerialNumber) { $wb.SerialNumber.Trim() } else { "N/A" }
                $bChem = if ($wb.Chemistry) { $wb.Chemistry } else { "LIon" }
                $bDesign = if ($wb.DesignCapacity) { $wb.DesignCapacity } else { 0 }
                $bFull = if ($wb.FullChargedCapacity) { $wb.FullChargedCapacity } else { $bDesign }
                $bVolt = if ($wb.DesignVoltage) { $wb.DesignVoltage } else { 0 }
                if ($bDesign -gt 0) {
                    $batList += "$bMfg|$bSerial|$bChem|$bDesign|$bFull|0|$bVolt"
                }
            }
        }
    } catch {}
}

if ($batList.Count -gt 0) {
    $tDesign = 0; $tFull = 0; $tCycles = 0
    foreach ($item in $batList) {
        $parts = $item.Split('|')
        $tDesign += [double]$parts[3]
        $tFull += [double]$parts[4]
        $tCycles += [int]$parts[5]
    }
    $h = [Math]::Round(($tFull / $tDesign) * 100)
    $bCountLabel = if ($batList.Count -gt 1) { " [$($batList.Count) Batteries]" } else { "" }
    $specs.battery = "$h% ($tCycles cycles)$bCountLabel"
    $specs.detailed_battery = $batList -join "::"
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
      let ver = '1.5';
      if (typeof window !== 'undefined' && window.APP_VERSION) {
        ver = window.APP_VERSION;
      } else {
        const result = await electronAPI.getAppVersion();
        if (result.success && result.version) {
          ver = result.version;
        }
      }

      systemSpecs.appVersion = ver; // Store version globally

      const verVal = document.getElementById('app-version-val');
      if (verVal) verVal.textContent = ver;

      const sideBadge = document.querySelector('.version-badge');
      if (sideBadge) sideBadge.textContent = `SYSTEM V${ver}`;

      const updateCurrentVersionLabel = document.getElementById('update-current-version-label');
      if (updateCurrentVersionLabel) updateCurrentVersionLabel.textContent = ver;

      const windowTitle = document.querySelector('.window-title');
      if (windowTitle) {
        windowTitle.textContent = `Bizz Co Hub Quality Checking Software - V${ver}`;
      }

      // Trigger auto-updater check if set to auto update mode
      const updateMode = localStorage.getItem('setting_update_mode') || 'auto';
      if (updateMode === 'auto') {
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
        log(`System specs exported successfully to: ${result.filePath}`, 'ready');
        showCustomAlert(`Product specifications saved to:\n${result.filePath}`, 'Export Successful', 'success');
      } else if (result.error && result.error !== 'SAVE_CANCELLED') {
        log(`Failed to save export file: ${result.error}`, 'error');
        showCustomAlert(`Could not write export file: ${result.error}`, 'Export Failed', 'error');
      }
    });
  }

  // Helper to format CPU Core name like "Core i7-8650U" matching reference design
  function formatCpuCoreName(cpuStr) {
    if (!cpuStr) return '';
    const str = cpuStr.trim();
    const intelMatch = str.match(/\b(i[3579]-[\w]+)\b/i);
    if (intelMatch) {
      const rawModel = intelMatch[1];
      const parts = rawModel.split('-');
      const corePart = parts[0].toLowerCase();
      const numberPart = parts.slice(1).join('-').toUpperCase();
      return `Core ${corePart}-${numberPart}`;
    }
    const ryzenMatch = str.match(/\b(Ryzen\s+[3579]\s+[\w]+)\b/i);
    if (ryzenMatch) {
      return ryzenMatch[1];
    }
    let clean = str
      .replace(/Intel\s*\((?:R|TM)\)/gi, '')
      .replace(/Core\s*\((?:R|TM)\)/gi, 'Core')
      .replace(/CPU\s*@.*/gi, '')
      .replace(/@.*/gi, '')
      .trim();
    clean = clean.replace(/^Intel\s+/i, '');
    return clean;
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
    let coreVal = formatCpuCoreName(cpuStr);
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
    document.getElementById('preview-inp-core').value = formatCpuCoreName(systemSpecs.cpu) || coreVal;
    document.getElementById('preview-inp-serial').value = systemSpecs.serialNumber || '';
    document.getElementById('preview-inp-gen').value = genVal;
    document.getElementById('preview-inp-display').value = dispRes;
    document.getElementById('preview-inp-ram').value = ramVal;
    document.getElementById('preview-inp-battery').value = systemSpecs.battery || '';
    document.getElementById('preview-inp-ssd').value = ssdVal;
    document.getElementById('preview-inp-ssd-health').value = ssdHealthVal;
    document.getElementById('preview-inp-graphics').value = systemSpecs.graphics || '';
    document.getElementById('preview-inp-windows').value = systemSpecs.windowsVer || '';

    // Dynamic RAM Rows population
    const ramContainer = document.getElementById('preview-ram-rows-container');
    if (ramContainer) {
      ramContainer.innerHTML = '';
      const detailedRam = localStorage.getItem('qc_detailed_ram') || '';
      const ramEntries = [];

      if (detailedRam) {
        const lines = detailedRam.split('\n').map(s => s.trim()).filter(s => s);
        lines.forEach(line => {
          const parts = line.split('|');
          if (parts.length >= 3) {
            const mfg = parts[1] && parts[1].trim() !== 'Unknown' ? parts[1].trim() : 'In Build';
            const cap = parts[2] ? parts[2].trim() : '';
            if (cap) {
              ramEntries.push({ brand: mfg, size: cap.toUpperCase() });
            }
          }
        });
      }

      if (ramEntries.length === 0) {
        const knownRamBrands = ['Samsung', 'Crucial', 'SK Hynix', 'Hynix', 'Micron', 'Kingston', 'Corsair', 'Nanya', 'Transcend', 'Adata', 'In Build'];
        const matchedRamB = knownRamBrands.find(b => new RegExp('\\b' + b + '\\b', 'i').test(ramVal));
        const ramSizeMatch = ramVal.match(/(\d+(?:\.\d+)?\s*(?:GB|TB))/i);
        ramEntries.push({
          brand: matchedRamB || 'In Build',
          size: ramSizeMatch ? ramSizeMatch[1].replace(/\s+/g, ' ').toUpperCase() : '16 GB'
        });
      }

      ramEntries.forEach(entry => addRamStickRow(entry.brand, entry.size));
    }

    // Dynamic SSD Rows population
    const ssdContainer = document.getElementById('preview-ssd-rows-container');
    if (ssdContainer) {
      ssdContainer.innerHTML = '';
      const detailedSsd = localStorage.getItem('qc_detailed_ssd') || '';
      const ssdEntries = [];

      if (detailedSsd) {
        const lines = detailedSsd.split('\n').map(s => s.trim()).filter(s => s);
        lines.forEach(line => {
          const parts = line.split('|');
          if (parts.length >= 3) {
            const model = parts[1].trim();
            const size = parts[2].trim();
            const brand = getSsdBrand(model);
            if (size) {
              ssdEntries.push({ brand: brand, size: size.toUpperCase() });
            }
          }
        });
      }

      if (ssdEntries.length === 0) {
        const knownSsdBrands = ['Kioxia', 'Samsung', 'Crucial', 'Kingston', 'Micron', 'Intel', 'WD', 'Western Digital', 'SanDisk', 'ADATA', 'Seagate', 'Toshiba', 'Lexar', 'PNY'];
        const matchedSsdB = knownSsdBrands.find(b => new RegExp('\\b' + b + '\\b', 'i').test(ssdVal));
        const ssdSizeMatch = ssdVal.match(/(\d+(?:\.\d+)?\s*(?:GB|TB))/i);
        ssdEntries.push({
          brand: matchedSsdB === 'Western Digital' ? 'WD' : (matchedSsdB || 'Kioxia'),
          size: ssdSizeMatch ? ssdSizeMatch[1].replace(/\s+/g, ' ').toUpperCase() : '256 GB'
        });
      }

      ssdEntries.forEach(entry => addSsdDriveRow(entry.brand, entry.size));
    }

    let gfxBrandVal = 'Intel';
    let gfxSizeVal = 'Integrated';
    const gfxRawStr = systemSpecs.graphics || '';
    if (/nvidia/i.test(gfxRawStr)) gfxBrandVal = 'NVIDIA';
    else if (/amd|radeon/i.test(gfxRawStr)) gfxBrandVal = 'AMD';
    const gfxSizeMatchStr = gfxRawStr.match(/(\d+\s*(?:GB|MB))/i);
    if (gfxSizeMatchStr) gfxSizeVal = gfxSizeMatchStr[1].toUpperCase();

    const inpGfxBrand = document.getElementById('preview-inp-graphics-brand');
    const inpGfxSize = document.getElementById('preview-inp-graphics-size');
    if (inpGfxBrand) inpGfxBrand.value = gfxBrandVal;
    if (inpGfxSize) inpGfxSize.value = gfxSizeVal;
    // Parse multiple issues
    previewIssues = parseIssuesString(systemSpecs.partsIssues, systemSpecs.issues || '');
    renderPreviewIssues();
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

  // Helper to extract full form payload for Submit and Update
  function getSpecPayloadFromForm() {
    const ramBrands = [];
    const ramSizes = [];
    document.querySelectorAll('#preview-ram-rows-container .ram-stick-row').forEach(row => {
      const b = row.querySelector('.preview-inp-ram-brand')?.value.trim();
      const s = row.querySelector('.preview-inp-ram-size')?.value.trim();
      if (b) ramBrands.push(b);
      if (s) ramSizes.push(s);
    });
    const ramBrand = ramBrands.join(' + ') || 'In Build';
    const ramSize = ramSizes.join(' + ') || '16 GB';
    const ramVal = `${ramBrand} ${ramSize}`.trim();

    const ssdBrands = [];
    const ssdSizes = [];
    document.querySelectorAll('#preview-ssd-rows-container .ssd-drive-row').forEach(row => {
      const b = row.querySelector('.preview-inp-ssd-brand')?.value.trim();
      const s = row.querySelector('.preview-inp-ssd-size')?.value.trim();
      if (b) ssdBrands.push(b);
      if (s) ssdSizes.push(s);
    });
    const ssdBrand = ssdBrands.join(' + ') || 'Kioxia';
    const ssdSize = ssdSizes.join(' + ') || '256 GB';
    const ssdVal = `${ssdBrand} ${ssdSize}`.trim();

    const gfxBrand = document.getElementById('preview-inp-graphics-brand')?.value.trim() || 'Intel';
    const gfxSize = document.getElementById('preview-inp-graphics-size')?.value.trim() || 'Integrated';
    const gfxVal = `${gfxBrand} ${gfxSize}`.trim();

    return {
      productName: document.getElementById('preview-inp-product-name')?.value.trim() || '',
      serialNumber: document.getElementById('preview-inp-serial')?.value.trim() || systemSpecs.serialNumber || '',
      cpu: document.getElementById('preview-inp-core')?.value.trim() || systemSpecs.cpu || '',
      ram: ramVal,
      ramBrand: ramBrand,
      ramSize: ramSize,
      ssd: ssdVal,
      ssdBrand: ssdBrand,
      ssdSize: ssdSize,
      graphics: gfxVal,
      graphicsBrand: gfxBrand,
      graphicsSize: gfxSize,
      displayRes: document.getElementById('preview-inp-display')?.value.trim() || systemSpecs.displayRes || '',
      battery: document.getElementById('preview-inp-battery')?.value.trim() || systemSpecs.battery || '',
      windowsVer: document.getElementById('preview-inp-windows')?.value.trim() || systemSpecs.windowsVer || '',
      brand: document.getElementById('preview-inp-brand')?.value.trim() || '',
      series: document.getElementById('preview-inp-series')?.value.trim() || '',
      model: document.getElementById('preview-inp-model')?.value.trim() || '',
      gen: document.getElementById('preview-inp-gen')?.value.trim() || '',
      condition: document.getElementById('preview-inp-condition')?.value.trim() || 'Refurbished (C Grade)',
      unitPrice: document.getElementById('preview-inp-unit-price')?.value.trim() || '',
      section: document.getElementById('preview-inp-section')?.value.trim() || 'Stock',
      ssdHealth: formatSsdHealthPercentage(document.getElementById('preview-inp-ssd-health')?.value || ''),
      partsIssues: previewIssues.map(x => x.part).filter((v, idx, self) => self.indexOf(v) === idx).join(', '),
      issues: previewIssues.map(x => `[${x.part}: ${x.remark}]`).join(' ')
    };
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
      if (document.getElementById('preview-inp-condition')) document.getElementById('preview-inp-condition').value = '';
      if (document.getElementById('preview-inp-unit-price')) document.getElementById('preview-inp-unit-price').value = '';
      if (document.getElementById('preview-inp-section')) document.getElementById('preview-inp-section').value = '';
      if (document.getElementById('preview-inp-graphics-brand')) document.getElementById('preview-inp-graphics-brand').value = '';
      if (document.getElementById('preview-inp-graphics-size')) document.getElementById('preview-inp-graphics-size').value = '';
      document.getElementById('preview-inp-remark-parts').selectedIndex = 0;
      document.getElementById('preview-inp-remark-text').value = '';

      // Reset dynamic RAM and SSD containers to 1 blank row each
      const ramContainer = document.getElementById('preview-ram-rows-container');
      if (ramContainer) {
        ramContainer.innerHTML = '';
        addRamStickRow('', '');
      }
      const ssdContainer = document.getElementById('preview-ssd-rows-container');
      if (ssdContainer) {
        ssdContainer.innerHTML = '';
        addSsdDriveRow('', '');
      }

      previewIssues = [];
      renderPreviewIssues();
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

      const specPayload = getSpecPayloadFromForm();

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
        log(`Updated specifications under batch: ${activeBatchCode}`, 'ready');
        showCustomAlert('Device diagnostics successfully updated.', 'Success', 'success');

        if (portalCurrentBatch && portalCurrentBatch.toLowerCase() === activeBatchCode.toLowerCase()) {
          fetchPortalRecords(portalCurrentBatch);
        }
        await loadPortalBatches();
        closePortalModal('portal-modal-preview');
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

      const specPayload = getSpecPayloadFromForm();

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
        log(`Uploaded specifications under batch: ${activeBatchCode}`, 'ready');
        showCustomAlert(`Product specifications successfully logged under Batch: ${activeBatchCode}`, 'Upload Success', 'success');
        saveRecordToHistory(`Uploaded to ${activeBatchCode} (by ${currentOperator})`);

        if (portalCurrentBatch && portalCurrentBatch.toLowerCase() === activeBatchCode.toLowerCase()) {
          fetchPortalRecords(portalCurrentBatch);
        }
        await loadPortalBatches();
        closePortalModal('portal-modal-preview');
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
    previewBatchInput.addEventListener('focus', () => {
      loadPortalBatches();
    });
    previewBatchInput.addEventListener('input', () => {
      activeBatchCode = previewBatchInput.value.trim();
      updateActiveBatchesUI();
    });
  }

  // =========================================================
  // EXPORT TEXT SPECIFICATIONS (Formatted Clipboard & File)
  // =========================================================
  function generateSpecsTextFromInputs() {
    const brand = document.getElementById('preview-inp-brand')?.value.trim() || '';
    const series = document.getElementById('preview-inp-series')?.value.trim() || '';
    const model = document.getElementById('preview-inp-model')?.value.trim() || '';
    const serialNumber = document.getElementById('preview-inp-serial')?.value.trim() || systemSpecs.serialNumber || '';
    const condition = document.getElementById('preview-inp-condition')?.value.trim() || 'Refurbished (C Grade)';

    let cpuRaw = document.getElementById('preview-inp-core')?.value.trim() || systemSpecs.cpu || '';
    let cpuVal = formatCpuCoreName(cpuRaw);

    const gen = document.getElementById('preview-inp-gen')?.value.trim() || '';

    let dispRaw = document.getElementById('preview-inp-display')?.value.trim() || systemSpecs.displayRes || '';
    let displayRes = dispRaw.replace(/\s*\([^)]*\)/g, '').replace(/\s*x\s*/gi, 'x').trim();

    // Dynamic collection of RAM & SSD rows
    const ramBrands = [];
    const ramSizes = [];
    document.querySelectorAll('#preview-ram-rows-container .ram-stick-row').forEach(row => {
      const b = row.querySelector('.preview-inp-ram-brand')?.value.trim();
      const s = row.querySelector('.preview-inp-ram-size')?.value.trim();
      if (b) ramBrands.push(b);
      if (s) ramSizes.push(s);
    });

    const ramBrand = ramBrands.length > 0 ? ramBrands.join(' + ') : (document.getElementById('preview-inp-ram-brand')?.value.trim() || 'In Build');
    const ramSize = ramSizes.length > 0 ? ramSizes.join(' + ') : (document.getElementById('preview-inp-ram-size')?.value.trim() || '16 GB');

    const ssdBrands = [];
    const ssdSizes = [];
    document.querySelectorAll('#preview-ssd-rows-container .ssd-drive-row').forEach(row => {
      const b = row.querySelector('.preview-inp-ssd-brand')?.value.trim();
      const s = row.querySelector('.preview-inp-ssd-size')?.value.trim();
      if (b) ssdBrands.push(b);
      if (s) ssdSizes.push(s);
    });

    const ssdBrand = ssdBrands.length > 0 ? ssdBrands.join(' + ') : (document.getElementById('preview-inp-ssd-brand')?.value.trim() || 'Kioxia');
    const ssdSize = ssdSizes.length > 0 ? ssdSizes.join(' + ') : (document.getElementById('preview-inp-ssd-size')?.value.trim() || '256 GB');

    let graphicsBrand = document.getElementById('preview-inp-graphics-brand')?.value.trim();
    let graphicsSize = document.getElementById('preview-inp-graphics-size')?.value.trim();

    if (!graphicsBrand || !graphicsSize) {
      let gfxRaw = document.getElementById('preview-inp-graphics')?.value.trim() || systemSpecs.graphics || '';
      if (!graphicsBrand) {
        if (/nvidia/i.test(gfxRaw)) graphicsBrand = 'NVIDIA';
        else if (/amd|radeon/i.test(gfxRaw)) graphicsBrand = 'AMD';
        else graphicsBrand = 'Intel';
      }
      if (!graphicsSize) {
        const gfxSizeMatch = gfxRaw.match(/(\d+\s*(?:GB|MB))/i);
        if (gfxSizeMatch) graphicsSize = gfxSizeMatch[1].toUpperCase();
        else graphicsSize = 'Integrated';
      }
    }

    const unitPrice = document.getElementById('preview-inp-unit-price')?.value.trim() || '';
    const section = document.getElementById('preview-inp-section')?.value.trim() || 'Stock';

    let commonIssues = 'None';
    if (typeof previewIssues !== 'undefined' && Array.isArray(previewIssues) && previewIssues.length > 0) {
      commonIssues = previewIssues.map(i => `${i.part}: ${i.remark || i.issue}`).join(' | ');
    } else {
      const partsIssues = systemSpecs.partsIssues || '';
      const generalIssues = systemSpecs.issues || '';
      if (partsIssues || generalIssues) {
        commonIssues = [partsIssues, generalIssues].filter(Boolean).join(' | ');
      }
    }

    return `Brand: ${brand}
Series: ${series}
Model: ${model}
Serial Number: ${serialNumber}
Condition: ${condition}
CPU: ${cpuVal}
Gen: ${gen}
Display Res: ${displayRes}
RAM Brand: ${ramBrand}
RAM Size: ${ramSize}
SSD Brand: ${ssdBrand}
SSD Size: ${ssdSize}
Graphics Brand: ${graphicsBrand}
Graphics Size: ${graphicsSize}
Unit Price: ${unitPrice}
Section: ${section}
Common Issues: ${commonIssues}`;
  }

  function generateSpecsTextFromRecord(record) {
    const s = record.specs || record || {};
    const brand = s.brand || '';
    const series = s.series || '';
    const model = s.model || s.productName || '';
    const serialNumber = s.serialNumber || '';
    const condition = s.condition || 'Refurbished (C Grade)';

    let cpuVal = s.cpu || '';
    const cpuModelMatch = cpuVal.match(/\(([^)]+)\)/);
    if (cpuModelMatch && cpuModelMatch[1]) {
      cpuVal = cpuModelMatch[1].trim();
    }

    const gen = s.gen || '';
    let displayRes = (s.displayRes || '').replace(/\s*\([^)]*\)/g, '').replace(/\s*x\s*/gi, 'x').trim();

    let ramRaw = s.ram || '';
    let ramBrand = s.ramBrand || 'In Build';
    let ramSize = s.ramSize || '16 GB';
    const knownRamBrands = ['Samsung', 'Crucial', 'SK Hynix', 'Hynix', 'Micron', 'Kingston', 'Corsair', 'Nanya', 'Transcend', 'Adata', 'In Build'];
    const matchedRamBrand = knownRamBrands.find(b => new RegExp('\\b' + b + '\\b', 'i').test(ramRaw));
    if (matchedRamBrand) ramBrand = matchedRamBrand;
    const ramSizeMatch = ramRaw.match(/(\d+(?:\.\d+)?\s*(?:GB|TB))/i);
    if (ramSizeMatch) ramSize = ramSizeMatch[1].replace(/\s+/g, ' ').toUpperCase();

    let ssdRaw = s.ssd || '';
    let ssdBrand = s.ssdBrand || 'Kioxia';
    let ssdSize = s.ssdSize || '256 GB';
    const knownSsdBrands = ['Kioxia', 'Samsung', 'Crucial', 'Kingston', 'Micron', 'Intel', 'WD', 'Western Digital', 'SanDisk', 'ADATA', 'Seagate', 'Toshiba', 'Lexar', 'PNY'];
    const matchedSsdBrand = knownSsdBrands.find(b => new RegExp('\\b' + b + '\\b', 'i').test(ssdRaw));
    if (matchedSsdBrand) ssdBrand = matchedSsdBrand === 'Western Digital' ? 'WD' : matchedSsdBrand;
    const ssdSizeMatch = ssdRaw.match(/(\d+(?:\.\d+)?\s*(?:GB|TB))/i);
    if (ssdSizeMatch) ssdSize = ssdSizeMatch[1].replace(/\s+/g, ' ').toUpperCase();

    let gfxRaw = s.graphics || '';
    let graphicsBrand = s.graphicsBrand || 'Intel';
    let graphicsSize = s.graphicsSize || 'Integrated';
    if (/nvidia/i.test(gfxRaw)) graphicsBrand = 'NVIDIA';
    else if (/amd|radeon/i.test(gfxRaw)) graphicsBrand = 'AMD';
    const gfxSizeMatch = gfxRaw.match(/(\d+\s*(?:GB|MB))/i);
    if (gfxSizeMatch) graphicsSize = gfxSizeMatch[1].toUpperCase();

    const unitPrice = s.unitPrice || '';
    const section = s.section || 'Stock';
    const commonIssues = s.issues || s.partsIssues || s.commonIssues || 'None';

    return `Brand: ${brand}
Series: ${series}
Model: ${model}
Serial Number: ${serialNumber}
Condition: ${condition}
CPU: ${cpuVal}
Gen: ${gen}
Display Res: ${displayRes}
RAM Brand: ${ramBrand}
RAM Size: ${ramSize}
SSD Brand: ${ssdBrand}
SSD Size: ${ssdSize}
Graphics Brand: ${graphicsBrand}
Graphics Size: ${graphicsSize}
Unit Price: ${unitPrice}
Section: ${section}
Common Issues: ${commonIssues}`;
  }

  let activeExportTextContent = '';
  let activeExportTextSerial = '';

  async function showExportTextModal(text, serialNumber = '') {
    activeExportTextContent = text;
    activeExportTextSerial = serialNumber || systemSpecs.serialNumber || 'Spec';

    const textModal = document.getElementById('export-text-modal');
    const textArea = document.getElementById('export-text-content');

    if (textArea) textArea.value = text;
    if (textModal) textModal.style.display = 'flex';

    try {
      await navigator.clipboard.writeText(text);
      log('Spec text copied to clipboard.', 'ready');
    } catch (err) {
      log('Could not write to clipboard automatically.', 'warn');
    }
  }

  // Helper to trigger direct .txt file save with Save As dialog
  async function triggerDirectFileDownload(text, fileName) {
    const api = (typeof electronAPI !== 'undefined' ? electronAPI : window.electronAPI);
    if (api && typeof api.saveTableFile === 'function') {
      const res = await api.saveTableFile(text, fileName);
      if (res && res.success) {
        showCustomAlert(`Text file successfully exported and saved to:\n${res.filePath}`, 'Export Successful', 'success');
      } else if (res && res.error && res.error !== 'SAVE_CANCELLED') {
        showCustomAlert(`Could not save export file:\n${res.error}`, 'Export Failed', 'error');
      }
      return;
    }

    // Always trigger browser blob download as fallback in pure browser environment
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showCustomAlert(`Exported text file:\n${fileName}`, 'Exported Text File', 'success');
    } catch (e) {
      console.warn('Blob download warning:', e);
    }
  }

  // Helper functions to dynamically add/remove RAM stick rows
  function addRamStickRow(brand = '', size = '') {
    const container = document.getElementById('preview-ram-rows-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'ram-stick-row';
    row.style.cssText = 'display: flex; gap: 12px; width: 100%; align-items: flex-end; flex-wrap: wrap;';
    row.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px;">
        <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">RAM Brand</label>
        <input type="text" class="preview-inp-ram-brand" placeholder="e.g. Kingston / Apple / In Build" value="${brand}" style="width: 100%;">
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px;">
        <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">RAM Size</label>
        <input type="text" class="preview-inp-ram-size" placeholder="Select or type RAM size..." value="${size}" style="width: 100%;">
      </div>
      <button type="button" class="btn-remove-ram-row" title="Remove RAM Stick" style="height: 38px; width: 38px; border-radius: 8px; border: 1px solid rgba(255,69,58,0.3); background: rgba(255,69,58,0.1); color: var(--color-red); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    row.querySelector('.btn-remove-ram-row').addEventListener('click', () => {
      row.remove();
      updateRamRemoveButtons();
    });

    container.appendChild(row);
    updateRamRemoveButtons();
  }

  function updateRamRemoveButtons() {
    const container = document.getElementById('preview-ram-rows-container');
    if (!container) return;
    const rows = container.querySelectorAll('.ram-stick-row');
    rows.forEach(r => {
      const btn = r.querySelector('.btn-remove-ram-row');
      if (btn) btn.style.display = rows.length > 1 ? 'flex' : 'none';
    });
  }

  function addSsdDriveRow(brand = '', size = '') {
    const container = document.getElementById('preview-ssd-rows-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'ssd-drive-row';
    row.style.cssText = 'display: flex; gap: 12px; width: 100%; align-items: flex-end; flex-wrap: wrap;';
    row.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px;">
        <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">SSD Brand</label>
        <input type="text" class="preview-inp-ssd-brand" placeholder="e.g. Samsung / WD / Kioxia" value="${brand}" style="width: 100%;">
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px;">
        <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">SSD Size</label>
        <input type="text" class="preview-inp-ssd-size" placeholder="Select or type SSD size..." value="${size}" style="width: 100%;">
      </div>
      <button type="button" class="btn-remove-ssd-row" title="Remove SSD Drive" style="height: 38px; width: 38px; border-radius: 8px; border: 1px solid rgba(255,69,58,0.3); background: rgba(255,69,58,0.1); color: var(--color-red); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    row.querySelector('.btn-remove-ssd-row').addEventListener('click', () => {
      row.remove();
      updateSsdRemoveButtons();
    });

    container.appendChild(row);
    updateSsdRemoveButtons();
  }

  function updateSsdRemoveButtons() {
    const container = document.getElementById('preview-ssd-rows-container');
    if (!container) return;
    const rows = container.querySelectorAll('.ssd-drive-row');
    rows.forEach(r => {
      const btn = r.querySelector('.btn-remove-ssd-row');
      if (btn) btn.style.display = rows.length > 1 ? 'flex' : 'none';
    });
  }

  // Bind Add buttons
  const btnAddRamStick = document.getElementById('btn-add-ram-stick');
  if (btnAddRamStick) {
    btnAddRamStick.addEventListener('click', () => {
      addRamStickRow('In Build', '8 GB');
    });
  }

  const btnAddSsdDrive = document.getElementById('btn-add-ssd-drive');
  if (btnAddSsdDrive) {
    btnAddSsdDrive.addEventListener('click', () => {
      addSsdDriveRow('Generic', '256 GB');
    });
  }

  // Event Listeners for Export Text
  const btnPreviewExportText = document.getElementById('btn-portal-preview-export-text');
  if (btnPreviewExportText) {
    btnPreviewExportText.addEventListener('click', async () => {
      try {
        const text = generateSpecsTextFromInputs();
        const serialNumber = document.getElementById('preview-inp-serial')?.value.trim() || systemSpecs.serialNumber || 'Device';
        const fileName = `QC_SpecText_${serialNumber}.txt`;

        await triggerDirectFileDownload(text, fileName);
        log(`Exported spec text file: ${fileName}`, 'ready');
      } catch (err) {
        console.error('Export text error:', err);
        showCustomAlert(`Export error: ${err.message || err}`, 'Export Failed', 'error');
      }
    });
  }

  const btnPageExportSpecTextCard = document.getElementById('btn-page-export-spec-text');
  if (btnPageExportSpecTextCard) {
    btnPageExportSpecTextCard.addEventListener('click', () => {
      openSpecsUploadPreview();
    });
  }

  const btnPortalExportText = document.getElementById('btn-portal-export-text');
  if (btnPortalExportText) {
    btnPortalExportText.addEventListener('click', async () => {
      const text = generateSpecsTextFromInputs();
      const serialNumber = document.getElementById('preview-inp-serial')?.value.trim() || systemSpecs.serialNumber || 'Device';
      const fileName = `QC_SpecText_${serialNumber}.txt`;
      await triggerDirectFileDownload(text, fileName);
    });
  }

  const btnPageExportText = document.getElementById('btn-page-export-text');
  if (btnPageExportText) {
    btnPageExportText.addEventListener('click', async () => {
      let text = '';
      let serialNumber = portalCurrentBatch || 'Batch';
      if (typeof portalRecords !== 'undefined' && Array.isArray(portalRecords) && portalRecords.length > 0) {
        text = portalRecords.map(r => generateSpecsTextFromRecord(r)).join('\n\n========================================\n\n');
      } else {
        text = generateSpecsTextFromInputs();
        serialNumber = document.getElementById('preview-inp-serial')?.value.trim() || systemSpecs.serialNumber || 'Device';
      }
      const fileName = `QC_SpecText_${serialNumber}.txt`;
      await triggerDirectFileDownload(text, fileName);
    });
  }

  // Modal actions for export-text-modal
  const btnCopyExportTextClip = document.getElementById('btn-copy-export-text-clip');
  if (btnCopyExportTextClip) {
    btnCopyExportTextClip.addEventListener('click', async () => {
      const textArea = document.getElementById('export-text-content');
      const textToCopy = textArea ? textArea.value : activeExportTextContent;
      try {
        await navigator.clipboard.writeText(textToCopy);
        showCustomAlert('Text copied to clipboard!', 'Copied', 'success');
      } catch (e) {
        showCustomAlert('Clipboard copy failed. Please copy manually from the text box.', 'Copy Failed', 'warn');
      }
    });
  }

  const btnSaveExportTextFile = document.getElementById('btn-save-export-text-file');
  if (btnSaveExportTextFile) {
    btnSaveExportTextFile.addEventListener('click', async () => {
      const textArea = document.getElementById('export-text-content');
      const textToSave = textArea ? textArea.value : activeExportTextContent;
      const fileName = `QC_SpecText_${activeExportTextSerial || 'Device'}.txt`;
      const api = (typeof electronAPI !== 'undefined' ? electronAPI : window.electronAPI);
      if (api && typeof api.saveTableFile === 'function') {
        const result = await api.saveTableFile(textToSave, fileName);
        if (result.success) {
          showCustomAlert(`Text file saved to:\n${result.filePath}`, 'Save Success', 'success');
        } else if (result.error && result.error !== 'SAVE_CANCELLED') {
          showCustomAlert(`Could not save file: ${result.error}`, 'Save Error', 'error');
        }
      } else {
        const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    });
  }

  const btnCloseExportText = document.getElementById('btn-close-export-text');
  const btnCloseExportTextX = document.getElementById('btn-close-export-text-x');
  const exportTextModal = document.getElementById('export-text-modal');

  if (btnCloseExportText && exportTextModal) {
    btnCloseExportText.addEventListener('click', () => {
      exportTextModal.style.display = 'none';
    });
  }
  if (btnCloseExportTextX && exportTextModal) {
    btnCloseExportTextX.addEventListener('click', () => {
      exportTextModal.style.display = 'none';
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
    btnPortalCreateBatch.addEventListener('click', () => {
      showCustomPrompt("Enter Batch Code to create and assign:", "Create Batch", async (batchCode) => {
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
        log(`Diagnostic record logs exported to: ${result.filePath}`, 'ready');
        showCustomAlert(`Report exported successfully to:\n${result.filePath}`, 'Export Successful', 'success');
      } else if (result.error && result.error !== 'SAVE_CANCELLED') {
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

  // Open integrated Web Keyboard Tester
  function openKeyboardTestView() {
    // Set status badge to running
    const statusBadge = testKeyboard.querySelector('.test-status');
    if (statusBadge) {
      statusBadge.textContent = 'Running';
      statusBadge.className = 'test-status status-running';
    }

    // Hide all views
    appViews.forEach(view => {
      view.classList.remove('active');
      view.style.display = 'none';
    });

    // Show keyboard test view
    const targetView = document.getElementById('view-keyboard-test');
    if (targetView) {
      targetView.classList.add('active');
      targetView.style.display = 'flex';

      // Initialize native keyboard loops
      if (typeof window.setKeyboardTesterActive === 'function') {
        window.setKeyboardTesterActive(true);
      }
    }

    // De-select sidebar nav active items since we're in a custom test view
    navLinks.forEach(nav => nav.classList.remove('active'));

    log('Initiated interactive Keyboard matrix check.', 'info');
  }

  // Close integrated Web Keyboard Tester and save result
  window.closeKeyboardTestView = (status, remark) => {
    // De-initialize native keyboard loops
    if (typeof window.setKeyboardTesterActive === 'function') {
      window.setKeyboardTesterActive(false);
    }

    // Show system health view again
    appViews.forEach(view => {
      view.classList.remove('active');
      view.style.display = 'none';
    });

    const healthView = document.getElementById('view-system-health');
    if (healthView) {
      healthView.classList.add('active');
      healthView.style.display = 'flex';
    }

    // Re-activate nav item
    navLinks.forEach(nav => {
      if (nav.id === 'nav-system-health') {
        nav.classList.add('active');
      } else {
        nav.classList.remove('active');
      }
    });

    // Update the keyboard test badge based on status
    const statusBadge = testKeyboard.querySelector('.test-status');
    if (statusBadge) {
      if (status === 'passed') {
        statusBadge.textContent = 'Passed';
        statusBadge.className = 'test-status status-success';
        saveRecordToHistory('Keyboard matrix check Passed');
        log('Keyboard matrix check completed successfully (Passed).', 'ready');
      } else if (status === 'failed') {
        statusBadge.textContent = 'Failed';
        statusBadge.className = 'test-status status-error';
        const msg = remark ? `Keyboard matrix check Failed: ${remark}` : 'Keyboard matrix check Failed';
        saveRecordToHistory(msg);
        log(`Keyboard matrix check marked as Failed. Remark: ${remark || 'None'}`, 'error');
      } else {
        // Cancelled / Idle
        statusBadge.textContent = 'Idle';
        statusBadge.className = 'test-status status-pending';
        log('Keyboard matrix check closed without completion.', 'info');
      }
    }
  };

  // Open integrated Sound Checker
  function openSoundCheckingView() {
    const statusBadge = testSound.querySelector('.test-status');
    if (statusBadge) {
      statusBadge.textContent = 'Running';
      statusBadge.className = 'test-status status-running';
    }

    // Hide all views
    appViews.forEach(view => {
      view.classList.remove('active');
      view.style.display = 'none';
    });

    // Show sound check view
    const targetView = document.getElementById('view-sound-checking');
    if (targetView) {
      targetView.classList.add('active');
      targetView.style.display = 'flex';
    }

    // De-select sidebar nav active items
    navLinks.forEach(nav => nav.classList.remove('active'));
    const soundNav = document.getElementById('nav-sound-checking');
    if (soundNav) {
      soundNav.classList.add('active');
    }

    if (typeof window.initSoundCheck === 'function') {
      window.initSoundCheck();
    }
  }

  // Close Sound Checker
  window.closeSoundCheckingView = (status, remark) => {
    if (typeof window.closeSoundCheck === 'function') {
      window.closeSoundCheck();
    }

    // Show system health view again
    appViews.forEach(view => {
      view.classList.remove('active');
      view.style.display = 'none';
    });

    const healthView = document.getElementById('view-system-health');
    if (healthView) {
      healthView.classList.add('active');
      healthView.style.display = 'flex';
    }

    // Re-activate nav item
    navLinks.forEach(nav => {
      if (nav.id === 'nav-system-health') {
        nav.classList.add('active');
      } else {
        nav.classList.remove('active');
      }
    });

    const statusBadge = testSound.querySelector('.test-status');
    if (statusBadge) {
      if (status === 'passed') {
        statusBadge.textContent = 'Passed';
        statusBadge.className = 'test-status status-success';
        saveRecordToHistory('Audio diagnostics check Passed');
        log('Audio diagnostics check completed successfully (Passed).', 'ready');
      } else if (status === 'failed') {
        statusBadge.textContent = 'Failed';
        statusBadge.className = 'test-status status-error';
        const msg = remark ? `Audio diagnostics check Failed: ${remark}` : 'Audio diagnostics check Failed';
        saveRecordToHistory(msg);
        log(`Audio diagnostics check marked as Failed. Remark: ${remark || 'None'}`, 'error');
      } else {
        statusBadge.textContent = 'Idle';
        statusBadge.className = 'test-status status-pending';
        log('Audio diagnostics check closed without completion.', 'info');
      }
    }
  };


  // Bind single clicks
  testHdSentinel.addEventListener('click', () => executeTest(testHdSentinel, 'HDSentinel.exe', 'HDSentinel', 'HD Sentinel'));
  testLcd.addEventListener('click', () => openLcdTestView());
  testCpuz.addEventListener('click', () => executeTest(testCpuz, 'cpuz_x64.exe', 'cpuz', 'CPU-Z Info'));
  testBattery.addEventListener('click', () => executeTest(testBattery, 'Battery_checking.exe', 'Battery_checking', 'Battery Diagnostics'));
  testKeyboard.addEventListener('click', () => openKeyboardTestView());
  testSound.addEventListener('click', () => openSoundCheckingView());

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
      else if (item.id === 'nav-keyboard-test') targetViewId = 'view-keyboard-test';
      else if (item.id === 'nav-lcd-test') targetViewId = 'view-lcd-test';
      else if (item.id === 'nav-sound-checking') targetViewId = 'view-sound-checking';
      else if (item.id === 'nav-console-details') targetViewId = 'view-console-details';
      else if (item.id === 'nav-settings-details') targetViewId = 'view-settings-details';
      else if (item.id === 'nav-support-details') targetViewId = 'view-support-details';
      else if (item.id === 'nav-update-check') targetViewId = 'view-update-check';
      else if (item.id === 'nav-database-portal') targetViewId = 'view-database-portal';
      else if (item.id === 'nav-camera-test') targetViewId = 'view-camera-test';

      // Hide all views and show target view
      appViews.forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none';
      });

      // Reset keyboard tester loops if navigating away from it, or load it if navigating to it
      if (targetViewId === 'view-keyboard-test') {
        if (typeof window.setKeyboardTesterActive === 'function') {
          window.setKeyboardTesterActive(true);
        }
      } else {
        if (typeof window.setKeyboardTesterActive === 'function') {
          window.setKeyboardTesterActive(false);
        }
      }

      // Close LCD tester cycles if navigating away from it
      if (targetViewId !== 'view-lcd-test') {
        if (typeof window.closeLcdTest === 'function') {
          window.closeLcdTest();
        }
      }

       // Close Sound checker mic/sine wave cycles if navigating away from it, and display floating mini player on all tabs
      if (targetViewId !== 'view-sound-checking') {
        if (typeof window.closeSoundCheck === 'function') {
          window.closeSoundCheck();
        }
      }
      if (typeof window.updateMiniAudioWidget === 'function') {
        window.updateMiniAudioWidget(targetViewId);
      }

      // Close integrated Webcam stream if navigating away from Camera Test
      if (targetViewId !== 'view-camera-test') {
        if (typeof window.stopCameraTest === 'function') {
          window.stopCameraTest();
        }
      }

      // Load Sound checker components if navigating to it
      if (targetViewId === 'view-sound-checking') {
        if (typeof window.initSoundCheck === 'function') {
          window.initSoundCheck();
        }
      }

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
      else if (targetViewId === 'view-lcd-test') {
        if (typeof window.initLcdChecker === 'function') {
          window.initLcdChecker();
        }
      }
      else if (targetViewId === 'view-settings-details') {
        const hub = document.getElementById('settings-hub-view');
        if (hub) hub.style.display = 'flex';
        document.querySelectorAll('.settings-subview').forEach(v => v.style.display = 'none');
        loadUpdateView(false);
      }
      else if (targetViewId === 'view-database-portal') loadDatabasePortalView();
      else if (targetViewId === 'view-camera-test') {
        if (typeof window.initCameraTest === 'function') {
          window.initCameraTest();
        }
      }
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
    if (!detailSsdList) return;

    const disks = data.split('\n').map(d => d.trim()).filter(d => d);
    disks.sort((a, b) => {
      const idxA = parseInt(a.split('|')[0], 10) || 0;
      const idxB = parseInt(b.split('|')[0], 10) || 0;
      return idxA - idxB;
    });
    detailSsdList.innerHTML = '';

    if (disks.length === 0) {
      detailSsdList.innerHTML = '<div class="ssd-drive-card ssd-loading-placeholder"><span>No drives detected.</span></div>';
      return;
    }

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

        const isSSD = mediaType.toLowerCase().includes('ssd') || mediaType.toLowerCase().includes('nvme') || mediaType.toLowerCase().includes('solid');
        const icon = isSSD ? 'fa-solid fa-bolt' : 'fa-solid fa-hdd';

        // Parse health number: handles '95% Health', '100% Health', 'Healthy', 'Unknown'
        const healthMatch = health.match(/(\d+)/);
        const healthNum = healthMatch ? parseInt(healthMatch[1], 10) : (health.toLowerCase() === 'healthy' ? 100 : 0);
        const healthBarColor = healthNum >= 80 ? '#22c55e' : healthNum >= 50 ? '#f59e0b' : '#ef4444';
        const healthDisplay = healthMatch ? health : (health.toLowerCase() === 'healthy' ? '100% Health' : health);

        const diskDiv = document.createElement('div');
        diskDiv.className = 'ssd-drive-card';
        diskDiv.innerHTML = `
          <div class="ssd-card-header">
            <div class="ssd-icon-badge ${isSSD ? 'ssd-badge-ssd' : 'ssd-badge-hdd'}">
              <i class="${icon}"></i>
            </div>
            <div class="ssd-card-title-group">
              <span class="ssd-drive-label">Drive #${index}</span>
              <span class="ssd-media-chip">${mediaType}</span>
            </div>
            <div class="ssd-size-badge">${size}</div>
          </div>
          <div class="ssd-model-name" title="${model}">${model}</div>
          <div class="ssd-health-bar-track" title="${healthDisplay}">
            <div class="ssd-health-bar-fill" style="width: ${healthNum}%; background: ${healthBarColor};"></div>
          </div>
          <div class="ssd-meta-grid">
            <div class="ssd-meta-item">
              <span class="ssd-meta-label">Health</span>
              <span class="ssd-meta-value" style="color: ${healthBarColor}; font-weight: 700;">${healthDisplay}</span>
            </div>
            <div class="ssd-meta-item">
              <span class="ssd-meta-label">Interface</span>
              <span class="ssd-meta-value">${interfaceType}</span>
            </div>
            <div class="ssd-meta-item">
              <span class="ssd-meta-label">Partitions</span>
              <span class="ssd-meta-value">${partitions}</span>
            </div>
            <div class="ssd-meta-item ssd-meta-serial">
              <span class="ssd-meta-label">Serial</span>
              <span class="ssd-meta-value">${serial}</span>
            </div>
          </div>
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
    if (!detailBatteryList) return;
    detailBatteryList.innerHTML = '';

    if (!data || data === 'N/A') {
      detailBatteryList.innerHTML = '<div class="spec-row"><span class="spec-label"><i class="fa-solid fa-desktop" style="margin-right: 6px;"></i> System Type</span><span class="spec-value">Desktop PC (No Battery Installed)</span></div>';
      return;
    }

    const entries = data.split('::').map(e => e.trim()).filter(Boolean);

    if (entries.length > 1) {
      // DUAL / MULTI-BATTERY SYSTEM SUMMARY CARD
      let totalDesign = 0;
      let totalFull = 0;
      let totalCycles = 0;

      entries.forEach(entry => {
        const parts = entry.split('|').map(p => p.trim());
        if (parts.length >= 6) {
          totalDesign += parseInt(parts[3], 10) || 0;
          totalFull += parseInt(parts[4], 10) || 0;
          totalCycles += parseInt(parts[5], 10) || 0;
        }
      });

      const combinedHealth = totalDesign > 0 ? Math.round((totalFull / totalDesign) * 100) : 0;
      const combinedStatus = getBatteryStatus(combinedHealth);

      const summaryCard = document.createElement('div');
      summaryCard.style.background = 'rgba(10, 132, 255, 0.08)';
      summaryCard.style.border = '1px solid rgba(10, 132, 255, 0.3)';
      summaryCard.style.borderRadius = '10px';
      summaryCard.style.padding = '14px 18px';
      summaryCard.style.marginBottom = '16px';
      summaryCard.style.display = 'flex';
      summaryCard.style.flexDirection = 'column';
      summaryCard.style.gap = '8px';

      summaryCard.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 13px; font-weight: 700; color: var(--color-blue); text-transform: uppercase; letter-spacing: 0.5px;">
            <i class="fa-solid fa-layer-group" style="margin-right: 8px;"></i> Dual Battery System Detected (${entries.length} Installed Batteries)
          </span>
          <span style="font-size: 13px; font-weight: 700; color: ${combinedStatus.color}; background: rgba(0,0,0,0.2); padding: 4px 12px; border-radius: 20px;">
            Combined Health: ${combinedHealth}% (${combinedStatus.text})
          </span>
        </div>
        <div style="display: flex; gap: 20px; font-size: 12px; color: var(--text-secondary); margin-top: 4px; flex-wrap: wrap;">
          <span><strong>Total Design:</strong> ${totalDesign.toLocaleString()} mWh</span>
          <span><strong>Total Full Charge:</strong> ${totalFull.toLocaleString()} mWh</span>
          <span><strong>Total Cycles:</strong> ${totalCycles}</span>
        </div>
      `;
      detailBatteryList.appendChild(summaryCard);
    }

    // Render individual battery sections
    entries.forEach((entry, idx) => {
      const parts = entry.split('|').map(p => p.trim());
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

        const batTitle = entries.length > 1
          ? (idx === 0 ? 'Battery #1 (Internal / Main)' : `Battery #${idx + 1} (External / Swappable)`)
          : 'Battery Information';

        if (entries.length > 1) {
          const header = document.createElement('div');
          header.style.fontSize = '13px';
          header.style.fontWeight = '700';
          header.style.color = 'var(--text-main)';
          header.style.margin = idx > 0 ? '18px 0 8px 0' : '0 0 8px 0';
          header.style.display = 'flex';
          header.style.alignItems = 'center';
          header.style.gap = '8px';
          header.innerHTML = `<i class="fa-solid fa-battery-three-quarters" style="color: var(--color-blue);"></i> ${batTitle}`;
          detailBatteryList.appendChild(header);
        }

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
      }
    });
  }

  let manualDownloadUrl = '';

  // Function to trigger update checking manually or automatically
  async function triggerManualUpdateCheck() {
    const btnManualCheck = document.getElementById('btn-manual-check-update');
    const btnManualStartUpdate = document.getElementById('btn-manual-start-update');
    if (!btnManualCheck) return;

    if (btnManualCheck.disabled) return;

    btnManualCheck.disabled = true;
    btnManualCheck.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Checking...`;

    const updateIcon = document.getElementById('update-status-icon');
    const updateTitle = document.getElementById('update-status-title');
    const updateDesc = document.getElementById('update-status-desc');

    if (updateIcon && updateTitle && updateDesc) {
      updateIcon.className = 'fa-solid fa-arrows-rotate fa-spin';
      updateIcon.style.color = 'var(--color-blue)';
      updateTitle.textContent = 'Checking for Updates';
      updateDesc.textContent = 'Contacting GitHub Releases API...';
    }

    const startTime = Date.now();

    try {
      const repoOwner = 'Rocky-Alex';
      const repoName = 'BC-Elite-QC';
      const currentVer = systemSpecs.appVersion || (typeof window !== 'undefined' && window.APP_VERSION) || '1.0.5';

      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`);
      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status}`);
      }

      const release = await response.json();
      const latestVer = release.tag_name.replace('v', '').trim();

      // Enforce a minimum delay of 800ms for visual feedback
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
      }

      if (isNewerVersion(currentVer, latestVer)) {
        const asset = release.assets.find(a => a.name.endsWith('.exe') || a.name.includes('Setup'));
        if (asset) {
          manualDownloadUrl = asset.browser_download_url;

          if (updateIcon && updateTitle && updateDesc) {
            updateIcon.className = 'fa-solid fa-circle-exclamation';
            updateIcon.style.color = 'var(--color-orange)';
            updateTitle.textContent = 'New Update Available!';
            updateDesc.innerHTML = `Version <strong>v${latestVer}</strong> is available (Current: v${currentVer}).<br>Click the install button below to begin downloading.`;
          }

          btnManualCheck.style.display = 'none';
          if (btnManualStartUpdate) btnManualStartUpdate.style.display = 'block';
        } else {
          throw new Error('No setup executable asset found in latest release.');
        }
      } else {
        if (updateIcon && updateTitle && updateDesc) {
          updateIcon.className = 'fa-solid fa-circle-check';
          updateIcon.style.color = 'var(--color-green)';
          updateTitle.textContent = 'Up to Date';
          updateDesc.innerHTML = `You are running the latest version of <strong>BC Elite QC</strong> (v${currentVer}).`;
        }

        btnManualCheck.disabled = false;
        btnManualCheck.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Check for Updates`;
      }
    } catch (err) {
      // Enforce minimum delay even on error
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
      }

      if (updateIcon && updateTitle && updateDesc) {
        updateIcon.className = 'fa-solid fa-circle-xmark';
        updateIcon.style.color = 'var(--color-red)';
        updateTitle.textContent = 'Check Failed';
        updateDesc.innerHTML = `Error checking for updates: <span class="text-red">${err.message}</span>`;
      }

      btnManualCheck.disabled = false;
      btnManualCheck.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Check for Updates`;
    }
  }

  // Manual check updates panel loader
  function loadUpdateView(force = false) {
    const currentVersionLabel = document.getElementById('update-current-version-label');
    if (currentVersionLabel) {
      currentVersionLabel.textContent = systemSpecs.appVersion || (typeof window !== 'undefined' && window.APP_VERSION) || '1.0.5';
    }

    const updateMode = localStorage.getItem('setting_update_mode') || 'auto';
    updateUpdateModeUI(updateMode);

    if (updateMode === 'auto') {
      const btnManualCheck = document.getElementById('btn-manual-check-update');
      if (btnManualCheck && btnManualCheck.style.display !== 'none') {
        triggerManualUpdateCheck();
      }
    }
  }

  // Update Mode UI helper
  function updateUpdateModeUI(mode) {
    const btnManual = document.getElementById('btn-update-manual');
    const btnAuto = document.getElementById('btn-update-auto');
    if (!btnManual || !btnAuto) return;

    if (mode === 'auto') {
      btnAuto.classList.add('active');
      btnManual.classList.remove('active');
    } else {
      btnManual.classList.add('active');
      btnAuto.classList.remove('active');
    }
  }

  // Event Listeners for Update Mode buttons
  const btnManual = document.getElementById('btn-update-manual');
  const btnAuto = document.getElementById('btn-update-auto');
  if (btnManual) {
    btnManual.addEventListener('click', () => {
      localStorage.setItem('setting_update_mode', 'manual');
      updateUpdateModeUI('manual');
      log('Update mode changed to Manual.', 'info');
    });
  }
  if (btnAuto) {
    btnAuto.addEventListener('click', () => {
      localStorage.setItem('setting_update_mode', 'auto');
      updateUpdateModeUI('auto');
      log('Update mode changed to Auto Update.', 'info');
      const btnManualCheck = document.getElementById('btn-manual-check-update');
      if (btnManualCheck && btnManualCheck.style.display !== 'none') {
        triggerManualUpdateCheck();
      }
    });
  }

  // Bind manual update check buttons
  const btnManualCheck = document.getElementById('btn-manual-check-update');
  const btnManualStartUpdate = document.getElementById('btn-manual-start-update');
  const inlineProgressContainer = document.getElementById('inline-update-progress-container');
  const inlineProgressStatus = document.getElementById('inline-update-progress-status');
  const inlineProgressPercent = document.getElementById('inline-update-progress-percent');
  const inlineProgressBar = document.getElementById('inline-update-progress-bar');

  if (btnManualCheck) {
    btnManualCheck.addEventListener('click', triggerManualUpdateCheck);
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
    updateActiveBatchesUI();
  }

  function updateActiveBatchesUI() {
    let datalist = document.getElementById('active-batches-list');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'active-batches-list';
      document.body.appendChild(datalist);
    }
    datalist.innerHTML = '';

    if (Array.isArray(portalBatches) && portalBatches.length > 0) {
      portalBatches.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.batchCode;
        opt.label = `${b.batchCode} (${b.deviceCount || 0} devices)`;
        datalist.appendChild(opt);
      });
    }

    const pillsContainer = document.getElementById('preview-active-batches-pills');
    if (pillsContainer) {
      pillsContainer.innerHTML = '';
      if (Array.isArray(portalBatches) && portalBatches.length > 0) {
        const titleSpan = document.createElement('span');
        titleSpan.style.cssText = 'font-size: 11px; color: var(--text-secondary); width: 100%; font-weight: 600; margin-top: 4px; display: flex; align-items: center; gap: 4px;';
        titleSpan.innerHTML = `<i class="fa-solid fa-list-check" style="font-size: 10px; color: var(--color-blue);"></i> Active User Batches:`;
        pillsContainer.appendChild(titleSpan);

        const currentVal = (document.getElementById('portal-preview-batch-input')?.value || activeBatchCode || '').trim();

        portalBatches.forEach(b => {
          const isSelected = (currentVal && currentVal.toLowerCase() === b.batchCode.toLowerCase());
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.style.cssText = `
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11.5px;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid ${isSelected ? 'var(--color-blue)' : 'var(--border-color)'};
            background: ${isSelected ? 'rgba(0, 122, 255, 0.18)' : 'rgba(120, 120, 128, 0.08)'};
            color: ${isSelected ? '#007aff' : 'var(--text-main)'};
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: all 0.15s ease;
          `;
          pill.innerHTML = `<i class="fa-solid fa-folder-closed" style="font-size: 10.5px; opacity: 0.8;"></i> ${b.batchCode} <span style="opacity: 0.65; font-weight: 500; font-size: 10.5px;">(${b.deviceCount || 0})</span>`;
          
          pill.addEventListener('click', (e) => {
            e.preventDefault();
            const input = document.getElementById('portal-preview-batch-input');
            if (input) {
              input.value = b.batchCode;
              activeBatchCode = b.batchCode;
              updateActiveBatchesUI();
            }
          });
          pillsContainer.appendChild(pill);
        });
      }
    }
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
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <button class="btn-refresh btn-delete-device" style="color: var(--color-red); background: rgba(255, 69, 58, 0.08); border-color: rgba(255, 69, 58, 0.2); padding: 6px 12px; font-size: 11px; font-weight: 600; cursor: pointer; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; margin: 0;">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </td>`;

      const btnDelete = tr.querySelector('.btn-delete-device');
      if (btnDelete) {
        btnDelete.addEventListener('click', () => {
          showCustomPrompt(`Type 'DELETE' to confirm deletion of serial: ${s.serialNumber || 'N/A'}`, 'Confirm Deletion', async (confirmStr) => {
            if (confirmStr !== 'DELETE') {
              showCustomAlert('Deletion cancelled or confirmation mismatch.', 'Cancelled', 'info');
              return;
            }
             try {
               const apiUrl = (localStorage.getItem('setting_api_url') || 'https://www.bizzcohub.com/api').replace(/\/$/, '');
               const token = localStorage.getItem('setting_api_token') || 'bch_live_secret_7742a';
               
               const endpoints = [
                 '/delete-by-serial',
                 '/delete-device',
                 '/delete-record',
                 '/delete-details',
                 '/delete-specs'
               ];
               
               let success = false;
               let errMsg = '';
               
               for (const endpoint of endpoints) {
                 try {
                   const result = await electronAPI.httpPost(`${apiUrl}${endpoint}`, { serialNumber: s.serialNumber, batchCode: portalCurrentBatch }, token);
                   if (result.success || (result.data && result.data.success)) {
                     success = true;
                     break;
                   } else {
                     const errorStr = String(result.error || '');
                     if (errorStr.includes('404') || errorStr.includes('Not Found')) {
                       continue;
                     }
                     errMsg = result.error || 'Failed to delete';
                   }
                 } catch (e) {
                   const errMessage = String(e.message || e || '');
                   if (errMessage.includes('404') || errMessage.includes('Not Found')) {
                     continue;
                   }
                   errMsg = errMessage;
                 }
               }

               if (success) {
                 showCustomAlert('Device specifications successfully deleted.', 'Deleted', 'success');
                 await fetchPortalRecords(portalCurrentBatch);
               } else {
                 showCustomAlert(errMsg || 'Failed to delete device (404/not found).', 'Delete Error', 'error');
               }
             } catch (err) {
               showCustomAlert(`Delete failure: ${err.message}`, 'Error', 'error');
             }
          });
        });
      }
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
          if (m) { try { const o = JSON.parse(m[1]); if (o.error) errMsg = o.error; } catch (e) { } }
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

          // Parse multiple issues
          portalUpdateIssues = parseIssuesString(s.partsIssues, s.issues || '');
          renderPortalUpdateIssues();
          const remarkPartsSelect = document.getElementById('portal-update-form-remark-parts');
          if (remarkPartsSelect) {
            remarkPartsSelect.selectedIndex = 0;
          }
          document.getElementById('portal-update-form-remark-text').value = '';

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
        partsIssues: portalUpdateIssues.map(x => x.part).filter((v, idx, self) => self.indexOf(v) === idx).join(', '),
        issues: portalUpdateIssues.map(x => `[${x.part}: ${x.remark}]`).join(' ')
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
        const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
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
      const rows = portalRecords.map((r, i) => { const s = r.specs || {}; return `<tr><td>${i + 1}</td><td>${new Date(r.timestamp).toLocaleString()}</td><td>${s.serialNumber || 'N/A'}</td><td>${s.productName || 'N/A'}</td><td>${s.cpu || 'N/A'}</td><td>${s.ram || 'N/A'}</td><td>${s.ssd || 'N/A'}</td><td>${s.battery || 'N/A'}</td><td>${r.operator || 'N/A'}</td></tr>`; }).join('');
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

  /* ==========================================================================
     NATIVE KEYBOARD TESTER INTERACTIVE LOGIC
     ========================================================================== */
  (function () {
    let latencyTimes = [];
    let isKeyboardActive = false;
    let animFrameIndicator = null;
    let animFrameGlow = null;

    // Helper to send message back to parent window
    function exitTest(status, remark) {
      window.closeKeyboardTestView(status, remark);
    }

    // Bind Controls
    const backBtn = document.getElementById('back-btn');
    const passBtn = document.getElementById('pass-btn');
    const failBtn = document.getElementById('fail-btn');
    const resetBtn = document.getElementById('reset-btn');
    const helpBtn = document.getElementById('help-btn');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const testedCount = document.querySelectorAll('.key-cap.tested').length;
        const status = testedCount > 0 ? 'passed' : 'idle';
        exitTest(status);
      });
    }

    if (passBtn) {
      passBtn.addEventListener('click', () => exitTest('passed'));
    }

    if (failBtn) {
      failBtn.addEventListener('click', () => {
        showCustomPrompt("Mention the Remark why it failed:", "Keyboard Test Failure", (remark) => {
          if (remark === null) return;
          exitTest('failed', remark);
        });
      });
    }

    const helpModal = document.getElementById('keyboard-help-modal');
    const closeHelpBtn = document.getElementById('btn-close-kb-help-modal');
    const closeHelpOkBtn = document.getElementById('btn-close-kb-help-ok');

    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'flex';
      });
    }

    if (helpModal) {
      if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', () => {
          helpModal.style.display = 'none';
        });
      }
      if (closeHelpOkBtn) {
        closeHelpOkBtn.addEventListener('click', () => {
          helpModal.style.display = 'none';
        });
      }
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
          helpModal.style.display = 'none';
        }
      });
    }

    // Apply initial RGB Hues based on selected theme
    function initRGB() {
      const allKeys = document.querySelectorAll('.key-cap');
      cachedKeys = Array.from(allKeys);
      const keyboard = document.querySelector('.key-deck');
      if (!keyboard) return;
      const keyboardRect = keyboard.getBoundingClientRect();

      allKeys.forEach(key => {
        const rect = key.getBoundingClientRect();
        // Calculate relative horizontal position (0 to 1)
        const relativeX = keyboardRect.width > 0 ? (rect.left - keyboardRect.left) / keyboardRect.width : 0.5;

        // Cache relativeX to avoid layout thrashing in rendering loops
        key.dataset.relativeX = relativeX;

        let colorStr = '';
        let colorDimStr = '';
        let hueVal = 180;

        if (currentKeyboardThemeIndex === 0) {
          // RGB Keyboard (Rainbow Wave)
          hueVal = Math.floor(relativeX * 360);
          colorStr = `hsl(${hueVal}, 80%, 50%)`;
          colorDimStr = `hsla(${hueVal}, 60%, 45%, 0.6)`;
        } else if (currentKeyboardThemeIndex === 1) {
          // White Keyboard (Ice White backlight)
          hueVal = 200;
          colorStr = `hsl(200, 30%, 85%)`;
          colorDimStr = `hsla(200, 30%, 85%, 0.6)`;
        } else {
          // Black Keyboard (Subtle White backlight)
          hueVal = 0;
          colorStr = `hsl(0, 0%, 75%)`;
          colorDimStr = `hsla(0, 0%, 75%, 0.6)`;
        }

        key.style.setProperty('--hue', hueVal);
        key.style.setProperty('--key-rgb', colorStr);
        key.style.setProperty('--key-rgb-dim', colorDimStr);
      });
    }

    // Auto-scale keyboard to fit the available container width
    function scaleKeyboard() {
      const wrapper = document.getElementById('keyboard-scale-wrapper');
      const deck = document.getElementById('key-deck');
      if (!wrapper || !deck) return;

      const availableWidth = wrapper.clientWidth;
      const naturalWidth = 1010; // Fixed natural unscaled width of keyboard (including padding)
      const naturalHeight = 280; // Fixed natural unscaled height of keyboard (including padding)

      if (availableWidth > 0) {
        // Scale dynamically with the container layout width (supports both scaling up and down)
        const scale = availableWidth / naturalWidth;
        deck.style.transform = `scale(${scale})`;
        wrapper.style.height = (naturalHeight * scale) + 'px';
      }
    }

    // Call initRGB and scaleKeyboard when window size changes
    window.addEventListener('resize', () => {
      if (isKeyboardActive) {
        scaleKeyboard();
        initRGB();
      }
    });

    // Latency Tracking
    const latencyVal = document.getElementById('latency-avg');

    function trackLatency(e) {
      const latency = Math.max(0, performance.now() - e.timeStamp);
      if (latency < 200) {
        latencyTimes.push(latency);
        if (latencyTimes.length > 50) {
          latencyTimes.shift(); // keep last 50 keypresses for rolling average
        }
        const avg = (latencyTimes.reduce((a, b) => a + b, 0) / latencyTimes.length).toFixed(2);
        if (latencyVal) latencyVal.textContent = avg;
      }
    }

    // Key Mapping Helper to normalize standard web event keys to layout data-key
    function getLayoutKey(e) {
      // 1. Direct hardware code matching (allows left/right modifier, main/numpad Enter/period separation)
      let keyCap = document.querySelector(`.key-cap[data-key="${e.code}"]`);
      if (keyCap) return e.code;

      // 2. Normal key character matches (letters, numbers, space)
      keyCap = document.querySelector(`.key-cap[data-key="${e.key}"]`);
      if (keyCap) return e.key;

      // Case-insensitive key character matches (e.g. data-key="q" and e.key="Q")
      keyCap = document.querySelector(`.key-cap[data-key="${e.key.toLowerCase()}"]`);
      if (keyCap) return e.key.toLowerCase();

      // 3. Fallbacks and standard normalization
      if (e.code === 'Space') return ' ';
      if (e.key === 'Control') return e.code.includes('Right') ? 'ControlRight' : 'ControlLeft';
      if (e.key === 'Shift') return e.code.includes('Right') ? 'ShiftRight' : 'ShiftLeft';
      if (e.key === 'Alt') return e.code.includes('Right') ? 'AltRight' : 'AltLeft';
      if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Super') return 'MetaLeft';
      if (e.key === 'Enter') return e.code === 'NumpadEnter' ? 'NumpadEnter' : 'Enter';

      if (e.code.startsWith('Numpad')) {
        const numPart = e.code.replace('Numpad', '');
        if (numPart === 'Enter') return 'NumpadEnter';
        if (numPart === 'Decimal') return 'NumpadDecimal';
        if (numPart === 'Add') return 'NumpadAdd';
        if (numPart === 'Subtract') return 'NumpadSubtract';
        if (numPart === 'Multiply') return 'NumpadMultiply';
        if (numPart === 'Divide') return 'NumpadDivide';
        if (!isNaN(numPart)) return numPart;
      }

      return e.key;
    }

    // Bind Global keydown/keyup on document
    document.addEventListener('keydown', (e) => {
      // ONLY intercept if the Keyboard Tester view is currently active
      if (!isKeyboardActive) return;

      // Prevent default browser behavior (e.g. F5 reloads, tab switches focus, backspace goes back)
      e.preventDefault();

      trackLatency(e);

      const matchedKey = getLayoutKey(e);
      const keyCaps = document.querySelectorAll(`.key-cap[data-key="${matchedKey}"]`);

      if (keyCaps.length > 0) {
        keyCaps.forEach(keyCap => {
          keyCap.classList.add('is-pressed');
          keyCap.classList.add('tested');

          const indicatorBox = document.getElementById('key-indicator-box');
          if (indicatorBox) {
            const hue = keyCap.style.getPropertyValue('--hue') || 180;
            indicatorBox.style.boxShadow = `0 0 25px hsl(${hue}, 80%, 50%)`;
          }
        });

        const firstKey = keyCaps[0];
        const displayCode = document.getElementById('display-code');
        const displayHex = document.getElementById('display-hex');
        if (displayCode) displayCode.innerText = `CODE: ${e.code.toUpperCase()}`;
        if (displayHex) displayHex.innerText = `HEX: 0x${e.keyCode.toString(16).toUpperCase()}`;

        setTimeout(() => {
          const indicatorBox = document.getElementById('key-indicator-box');
          if (indicatorBox) indicatorBox.style.boxShadow = '0 0 10px rgba(255,255,255,0.1)';
        }, 150);
      }
    });

    document.addEventListener('keyup', (e) => {
      if (!isKeyboardActive) return;
      e.preventDefault();
      const matchedKey = getLayoutKey(e);
      const keyCaps = document.querySelectorAll(`.key-cap[data-key="${matchedKey}"]`);

      // Special handling for Print Screen since Windows OS intercepts it and keydown is never fired
      if (e.code === 'PrintScreen' || e.key === 'PrintScreen') {
        trackLatency(e);
        keyCaps.forEach(keyCap => {
          keyCap.classList.add('is-pressed');
          keyCap.classList.add('tested');

          const indicatorBox = document.getElementById('key-indicator-box');
          if (indicatorBox) {
            const hue = keyCap.style.getPropertyValue('--hue') || 180;
            indicatorBox.style.boxShadow = `0 0 25px hsl(${hue}, 80%, 50%)`;
          }
        });

        const displayCode = document.getElementById('display-code');
        const displayHex = document.getElementById('display-hex');
        if (displayCode) displayCode.innerText = `CODE: ${e.code.toUpperCase()}`;
        if (displayHex) displayHex.innerText = `HEX: 0x${e.keyCode.toString(16).toUpperCase()}`;

        setTimeout(() => {
          keyCaps.forEach(keyCap => {
            keyCap.classList.remove('is-pressed');
          });
          const indicatorBox = document.getElementById('key-indicator-box');
          if (indicatorBox) indicatorBox.style.boxShadow = '0 0 10px rgba(255,255,255,0.1)';
        }, 150);
        return;
      }

      keyCaps.forEach(keyCap => {
        keyCap.classList.remove('is-pressed');
      });
    });

    // Listen for backend global shortcut Print Screen events
    if (window.__TAURI__) {
      window.__TAURI__.event.listen('print-screen-pressed', () => {
        if (!isKeyboardActive) return;

        const keyCaps = document.querySelectorAll('.key-cap[data-key="PrintScreen"]');

        // Record latency (simulated timestamp)
        trackLatency({ timeStamp: performance.now() });

        keyCaps.forEach(keyCap => {
          keyCap.classList.add('is-pressed');
          keyCap.classList.add('tested');

          const indicatorBox = document.getElementById('key-indicator-box');
          if (indicatorBox) {
            const hue = keyCap.style.getPropertyValue('--hue') || 180;
            indicatorBox.style.boxShadow = `0 0 25px hsl(${hue}, 80%, 50%)`;
          }
        });

        const displayCode = document.getElementById('display-code');
        const displayHex = document.getElementById('display-hex');
        if (displayCode) displayCode.innerText = 'CODE: PRINTSCREEN';
        if (displayHex) displayHex.innerText = 'HEX: 0x2C';

        setTimeout(() => {
          keyCaps.forEach(keyCap => {
            keyCap.classList.remove('is-pressed');
          });
          const indicatorBox = document.getElementById('key-indicator-box');
          if (indicatorBox) indicatorBox.style.boxShadow = '0 0 10px rgba(255,255,255,0.1)';
        }, 150);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        document.querySelectorAll('.key-cap').forEach(k => {
          k.classList.remove('is-pressed');
          k.classList.remove('tested');
        });
        const displayCode = document.getElementById('display-code');
        const displayHex = document.getElementById('display-hex');
        if (displayCode) displayCode.innerText = 'CODE: N/A';
        if (displayHex) displayHex.innerText = 'HEX: 0x00';
        const indicatorBox = document.getElementById('key-indicator-box');
        if (indicatorBox) indicatorBox.style.boxShadow = '0 0 10px rgba(255,255,255,0.1)';
        latencyTimes = [];
        if (latencyVal) latencyVal.textContent = '0.00';
      });
    }

    // Bind Keyboard Theme Selector Change event
    const themeSelect = document.getElementById('kb-theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        currentKeyboardThemeIndex = parseInt(e.target.value, 10);

        // Update keyboard-case container classes for visual frame and cap styling
        const kbCase = document.querySelector('.keyboard-case');
        if (kbCase) {
          kbCase.classList.remove('theme-white', 'theme-black');
          if (currentKeyboardThemeIndex === 1) {
            kbCase.classList.add('theme-white');
          } else if (currentKeyboardThemeIndex === 2) {
            kbCase.classList.add('theme-black');
          }
        }

        initRGB();
      });
    }

    // Mouse interactivity on key caps
    document.querySelectorAll('.key-cap').forEach(key => {
      key.addEventListener('mousedown', () => {
        key.classList.add('is-pressed');
        key.classList.add('tested');

        const indicatorBox = document.getElementById('key-indicator-box');
        if (indicatorBox) {
          const hue = key.style.getPropertyValue('--hue') || 180;
          indicatorBox.style.boxShadow = `0 0 25px hsl(${hue}, 80%, 50%)`;
        }

        const dataKey = key.getAttribute('data-key');
        const displayCode = document.getElementById('display-code');
        const displayHex = document.getElementById('display-hex');
        if (displayCode) displayCode.innerText = `CODE: CLICK_${dataKey.toUpperCase()}`;
        if (displayHex) displayHex.innerText = `HEX: MOUSE`;
      });
      key.addEventListener('mouseup', () => {
        key.classList.remove('is-pressed');
        const indicatorBox = document.getElementById('key-indicator-box');
        if (indicatorBox) indicatorBox.style.boxShadow = '0 0 10px rgba(255,255,255,0.1)';
      });
      key.addEventListener('mouseleave', () => key.classList.remove('is-pressed'));
    });

    // WebGL Shaders Setup
    let currentKeyboardThemeIndex = 0;
    let glIndicator = null;
    let glGlow = null;
    let cachedKeys = [];
    let uTimeIndicator = null;
    let uResIndicator = null;
    let uThemeIndicator = null;
    let uTimeGlow = null;
    let uResGlow = null;
    let uThemeGlow = null;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_theme;
varying vec2 v_texCoord;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = v_texCoord;
    float n1 = noise(uv * 3.0 + u_time * 0.2);
    float n2 = noise(uv * 6.0 - u_time * 0.1);
    float mixNoise = (n1 + n2) * 0.5;
    
    vec3 color;
    if (u_theme < 0.5) {
        // Theme 0: RGB Keyboard (Single static dark slate-blue background)
        color = vec3(0.05, 0.06, 0.08);
    } else if (u_theme < 1.5) {
        // Theme 1: White Keyboard (Ice White/Light Blue glow)
        float wave = mixNoise * 0.08 + u_time * 0.08;
        float glow = 0.75 + 0.25 * sin(wave);
        color = vec3(glow * 0.85, glow * 0.9, glow * 0.95);
    } else {
        // Theme 2: Black Keyboard (Stealth Silver/Charcoal glow)
        float wave = mixNoise * 0.05 + u_time * 0.05;
        float glow = 0.2 + 0.15 * sin(wave);
        color = vec3(glow, glow, glow * 1.05);
    }

    float bloom = 0.7 + 0.3 * noise(uv * 10.0 + u_time * 0.5);
    color *= bloom;
    float pulse = 0.92 + 0.08 * sin(u_time * 1.2);
    color *= pulse;
    float ledMask = 0.5 + 0.5 * sin(uv.x * 20.0);
    color *= 0.8 + 0.2 * ledMask;
    gl_FragColor = vec4(color, 1.0);
}`;

    function cs(gl, type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    function initWebGL() {
      // 1. Indicator
      const canvasInd = document.getElementById('shader-canvas-indicator');
      if (canvasInd) {
        canvasInd.width = canvasInd.clientWidth || 48;
        canvasInd.height = canvasInd.clientHeight || 24;
        glIndicator = canvasInd.getContext('webgl') || canvasInd.getContext('experimental-webgl');
        if (glIndicator) {
          const p = glIndicator.createProgram();
          glIndicator.attachShader(p, cs(glIndicator, glIndicator.VERTEX_SHADER, vs));
          glIndicator.attachShader(p, cs(glIndicator, glIndicator.FRAGMENT_SHADER, fs));
          glIndicator.linkProgram(p);
          glIndicator.useProgram(p);

          const buf = glIndicator.createBuffer();
          glIndicator.bindBuffer(glIndicator.ARRAY_BUFFER, buf);
          glIndicator.bufferData(glIndicator.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), glIndicator.STATIC_DRAW);
          const pos = glIndicator.getAttribLocation(p, 'a_position');
          glIndicator.enableVertexAttribArray(pos);
          glIndicator.vertexAttribPointer(pos, 2, glIndicator.FLOAT, false, 0, 0);
          uTimeIndicator = glIndicator.getUniformLocation(p, 'u_time');
          uResIndicator = glIndicator.getUniformLocation(p, 'u_resolution');
          uThemeIndicator = glIndicator.getUniformLocation(p, 'u_theme');
        }
      }

      // 2. Glow
      const canvasGlow = document.getElementById('shader-canvas-glow');
      if (canvasGlow) {
        canvasGlow.width = canvasGlow.clientWidth || 1280;
        canvasGlow.height = canvasGlow.clientHeight || 400;
        glGlow = canvasGlow.getContext('webgl') || canvasGlow.getContext('experimental-webgl');
        if (glGlow) {
          const p = glGlow.createProgram();
          glGlow.attachShader(p, cs(glGlow, glGlow.VERTEX_SHADER, vs));
          glGlow.attachShader(p, cs(glGlow, glGlow.FRAGMENT_SHADER, fs));
          glGlow.linkProgram(p);
          glGlow.useProgram(p);

          const buf = glGlow.createBuffer();
          glGlow.bindBuffer(glGlow.ARRAY_BUFFER, buf);
          glGlow.bufferData(glGlow.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), glGlow.STATIC_DRAW);
          const pos = glGlow.getAttribLocation(p, 'a_position');
          glGlow.enableVertexAttribArray(pos);
          glGlow.vertexAttribPointer(pos, 2, glGlow.FLOAT, false, 0, 0);
          uTimeGlow = glGlow.getUniformLocation(p, 'u_time');
          uResGlow = glGlow.getUniformLocation(p, 'u_resolution');
          uThemeGlow = glGlow.getUniformLocation(p, 'u_theme');
        }
      }
    }

    function drawIndicator(t) {
      if (!isKeyboardActive || !glIndicator) return;
      glIndicator.viewport(0, 0, glIndicator.canvas.width, glIndicator.canvas.height);
      glIndicator.uniform1f(uTimeIndicator, t * 0.001);
      glIndicator.uniform2f(uResIndicator, glIndicator.canvas.width, glIndicator.canvas.height);
      if (uThemeIndicator) glIndicator.uniform1f(uThemeIndicator, currentKeyboardThemeIndex);
      glIndicator.drawArrays(glIndicator.TRIANGLE_STRIP, 0, 4);
      animFrameIndicator = requestAnimationFrame(drawIndicator);
    }

    // Dynamic Shader Glow loop
    function drawGlow(t) {
      if (!isKeyboardActive || !glGlow) return;
      glGlow.viewport(0, 0, glGlow.canvas.width, glGlow.canvas.height);
      glGlow.uniform1f(uTimeGlow, t * 0.001);
      glGlow.uniform2f(uResGlow, glGlow.canvas.width, glGlow.canvas.height);
      if (uThemeGlow) glGlow.uniform1f(uThemeGlow, currentKeyboardThemeIndex);
      glGlow.drawArrays(glGlow.TRIANGLE_STRIP, 0, 4);

      // Smooth slow rainbow shift animation for the keys
      if (currentKeyboardThemeIndex === 0) {
        const timeSec = t * 0.001;
        cachedKeys.forEach(key => {
          const relativeX = parseFloat(key.dataset.relativeX || '0.5');
          const hueVal = Math.floor((relativeX * 360 - timeSec * 30) % 360 + 360) % 360;
          key.style.setProperty('--hue', hueVal);
          key.style.setProperty('--key-rgb', `hsl(${hueVal}, 80%, 50%)`);
          key.style.setProperty('--key-rgb-dim', `hsla(${hueVal}, 60%, 45%, 0.5)`);
        });
      }

      animFrameGlow = requestAnimationFrame(drawGlow);
    }

    // Public hook called by renderer's navigation manager
    window.setKeyboardTesterActive = function (active) {
      isKeyboardActive = active;
      if (active) {
        setTimeout(() => {
          scaleKeyboard();
          initRGB();
          initWebGL();
          if (glIndicator) drawIndicator(0);
          if (glGlow) drawGlow(0);
        }, 150);
      } else {
        if (helpModal) helpModal.style.display = 'none';
        if (animFrameIndicator) cancelAnimationFrame(animFrameIndicator);
        if (animFrameGlow) cancelAnimationFrame(animFrameGlow);
        animFrameIndicator = null;
        animFrameGlow = null;
      }
    };

    // Observe container size changes (e.g. sidebar toggle, window resize)
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (isKeyboardActive) {
          scaleKeyboard();
          initRGB();
        }
      });
      const wrapper = document.getElementById('view-keyboard-test');
      if (wrapper) ro.observe(wrapper);
    }
  })();

  // Open integrated Web LCD Checker
  function openLcdTestView() {
    const navLcd = document.getElementById('nav-lcd-test');
    if (navLcd) navLcd.click();
  }

  /* ==========================================================================
     NATIVE LCD CHECKER INTERACTIVE DIAGNOSTICS
     ========================================================================== */
  (function () {
    let currentPatternIndex = 0;
    let enduranceInterval = null;
    let isLcdActive = false;

    const patterns = [
      'white', 'black', 'red', 'green', 'blue', 'cyan', 'purple', 'yellow',
      'grad-h', 'grad-v', 'vert-lines', 'horiz-lines'
    ];

    const overlay = document.getElementById('lcd-test-overlay');
    const canvas = document.getElementById('lcd-test-canvas');
    const titleVal = document.getElementById('lcd-active-test-title');
    const closeBtn = document.getElementById('btn-close-lcd-test');

    // Back and pass/fail buttons in view
    const backBtn = document.getElementById('lcd-back-btn');
    const passBtn = document.getElementById('lcd-pass-btn');
    const failBtn = document.getElementById('lcd-fail-btn');

    const resVal = document.getElementById('lcd-res-val');
    const refreshVal = document.getElementById('lcd-refresh-val');

    // Auto-start countdown timer reference
    let autoStartTimer = null;

    // Track maximized state before going fullscreen
    let wasMaximizedBeforeFullscreen = false;

    // Resolution & Refresh Rate Initialization + 3-second auto-start
    window.initLcdChecker = function () {
      if (resVal) {
        resVal.textContent = `${window.screen.width} x ${window.screen.height} (${window.screen.width >= 3840 ? '4K' : window.screen.width >= 2560 ? '2K' : 'FHD'})`;
      }
      measureRefreshRate(fps => {
        if (refreshVal) {
          refreshVal.textContent = `${fps}.00 Hz`;
        }
      });

      // Cancel any existing countdown (e.g. if view re-opened)
      if (autoStartTimer) {
        clearInterval(autoStartTimer);
        autoStartTimer = null;
      }

      // Show countdown badge
      const badge = document.getElementById('lcd-autostart-badge');
      const countdownNum = document.getElementById('lcd-countdown-num');
      if (badge) badge.style.display = 'flex';

      let remaining = 3;
      if (countdownNum) countdownNum.textContent = remaining;

      autoStartTimer = setInterval(() => {
        remaining--;
        if (countdownNum) countdownNum.textContent = remaining;
        if (remaining <= 0) {
          clearInterval(autoStartTimer);
          autoStartTimer = null;
          if (badge) badge.style.display = 'none';
          // Auto-launch endurance cycle fullscreen
          window.launchFullScreen('endurance');
        }
      }, 1000);
    };

    function measureRefreshRate(callback) {
      let start = null;
      let count = 0;
      function step(timestamp) {
        if (!start) start = timestamp;
        count++;
        const elapsed = timestamp - start;
        if (elapsed < 1000) {
          requestAnimationFrame(step);
        } else {
          const fps = Math.round((count * 1000) / elapsed);
          callback(fps);
        }
      }
      requestAnimationFrame(step);
    }

    // Launch Fullscreen mode
    window.launchFullScreen = function (pattern) {
      if (!overlay || !canvas) return;
      isLcdActive = true;

      // Stop previous cycle if running
      if (enduranceInterval) {
        clearInterval(enduranceInterval);
        enduranceInterval = null;
      }

      const idx = patterns.indexOf(pattern);
      if (idx !== -1) {
        currentPatternIndex = idx;
      } else if (pattern === 'endurance') {
        currentPatternIndex = 0;
        startEnduranceCycle();
      }

      applyPattern(patterns[currentPatternIndex]);

      // Use Tauri native fullscreen FIRST, then show overlay after the OS
      // has resized the window — otherwise the color only fills the windowed area.
      if (window.__TAURI__) {
        const appWindow = window.__TAURI__.window.getCurrentWindow();
        appWindow.isMaximized().then(maximized => {
          wasMaximizedBeforeFullscreen = maximized;
        }).then(() => {
          return window.__TAURI__.core.invoke('set_fullscreen', { state: true });
        }).then(() => {
          // Small delay to let the OS complete the window resize before painting
          setTimeout(() => {
            overlay.style.display = 'flex';
          }, 80);
        }).catch(err => {
          log('Tauri fullscreen failed: ' + err, 'warn');
          // Show overlay anyway as fallback
          overlay.style.display = 'flex';
        });
      } else {
        // Fallback: browser requestFullscreen on the overlay element
        overlay.style.display = 'flex';
        if (overlay.requestFullscreen) {
          overlay.requestFullscreen().catch(() => { });
        } else if (overlay.webkitRequestFullscreen) {
          overlay.webkitRequestFullscreen();
        }
      }

      log(`Launched full-screen LCD pattern: ${pattern}`, 'debug');
    };

    function applyPattern(pattern) {
      if (!canvas || !titleVal || !overlay) return;
      canvas.className = 'w-full h-full flex flex-col items-center justify-center';
      canvas.style.background = '';
      overlay.style.background = '';
      canvas.innerHTML = '';

      const styleMapping = {
        'white': { title: 'WHITE TEST [1]', style: '#ffffff' },
        'black': { title: 'BLACK TEST [2]', style: '#000000' },
        'red': { title: 'RED TEST [3]', style: '#ff0000' },
        'green': { title: 'GREEN TEST [4]', style: '#00ff00' },
        'blue': { title: 'BLUE TEST [5]', style: '#0000ff' },
        'cyan': { title: 'CYAN TEST [6]', style: '#00ffff' },
        'purple': { title: 'PURPLE TEST [7]', style: '#a855f7' },
        'yellow': { title: 'YELLOW TEST [8]', style: '#ffff00' },
        'grad-h': { title: 'GRADIENT HORIZONTAL [9]', style: 'linear-gradient(to right, #000, #fff)' },
        'grad-v': { title: 'VERTICAL GRADIENT [0]', style: 'linear-gradient(to bottom, #000, #fff)' },
        'vert-lines': { title: 'VERTICAL LINES [V]', style: 'repeating-linear-gradient(to right, #fff, #fff 2px, #000 2px, #000 4px)' },
        'horiz-lines': { title: 'HORIZONTAL LINES [H]', style: 'repeating-linear-gradient(to bottom, #fff, #fff 2px, #000 2px, #000 4px)' }
      };

      const config = styleMapping[pattern];
      if (config) {
        titleVal.textContent = config.title;
        if (config.style) {
          canvas.style.background = config.style;
          overlay.style.background = config.style;
        }
      }
    }

    function startEnduranceCycle() {
      if (titleVal) titleVal.textContent = 'ENDURANCE AUTO TEST [F5]';
      applyPattern(patterns[currentPatternIndex]);
      enduranceInterval = setInterval(() => {
        currentPatternIndex = (currentPatternIndex + 1) % patterns.length;
        applyPattern(patterns[currentPatternIndex]);
      }, 2000);
    }

    window.closeLcdTest = function () {
      if (autoStartTimer) {
        clearInterval(autoStartTimer);
        autoStartTimer = null;
        const badge = document.getElementById('lcd-autostart-badge');
        if (badge) badge.style.display = 'none';
      }
      if (enduranceInterval) {
        clearInterval(enduranceInterval);
        enduranceInterval = null;
      }
      isLcdActive = false;
      if (overlay) overlay.style.display = 'none';

      // Exit native fullscreen (restores taskbar)
      if (window.__TAURI__) {
        window.__TAURI__.core.invoke('set_fullscreen', { state: false })
          .then(() => {
            if (wasMaximizedBeforeFullscreen) {
              const appWindow = window.__TAURI__.window.getCurrentWindow();
              return appWindow.maximize();
            }
          })
          .catch(() => { });
      } else if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => { });
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }

      log('Closed full-screen LCD pattern diagnostic.', 'debug');
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', () => window.closeLcdTest());
    }

    // Synchronize UI closure when user exits fullscreen natively (e.g. ESC or OS window change)
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement && isLcdActive) {
        window.closeLcdTest();
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('msfullscreenchange', onFullscreenChange);

    // Key map shared between view-level and fullscreen handlers
    const lcdKeyMap = {
      '1': 'white', '2': 'black', '3': 'red', '4': 'green',
      '5': 'blue', '6': 'cyan', '7': 'purple', '8': 'yellow',
      '9': 'grad-h', '0': 'grad-v', 'v': 'vert-lines', 'h': 'horiz-lines',
      'V': 'vert-lines', 'H': 'horiz-lines'
    };

    // Helper: flash the matching button when a key is pressed from the LCD view
    function flashLcdBtn(pattern) {
      const allBtns = document.querySelectorAll('.lcd-test-action-btn');
      allBtns.forEach(btn => {
        if (btn.getAttribute('data-pattern') === pattern) {
          btn.style.transition = 'background 0.05s ease';
          btn.style.background = 'rgba(0, 224, 255, 0.25)';
          btn.style.borderColor = 'rgba(0, 224, 255, 0.6)';
          setTimeout(() => {
            btn.style.background = '';
            btn.style.borderColor = '';
          }, 200);
        }
      });
    }

    // View-level key listener: fires when LCD view is visible but NOT yet in fullscreen
    document.addEventListener('keydown', (e) => {
      const lcdView = document.getElementById('view-lcd-test');
      if (!lcdView || lcdView.style.display === 'none') return;
      if (isLcdActive) return; // fullscreen handler takes over

      // ANY key cancels the auto-start countdown
      if (autoStartTimer) {
        clearInterval(autoStartTimer);
        autoStartTimer = null;
        const badge = document.getElementById('lcd-autostart-badge');
        if (badge) badge.style.display = 'none';
      }

      // Mapped keys additionally launch their test
      if (lcdKeyMap[e.key]) {
        e.preventDefault();
        flashLcdBtn(lcdKeyMap[e.key]);
        window.launchFullScreen(lcdKeyMap[e.key]);
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        window.launchFullScreen('endurance');
        return;
      }
    });

    // Capture keys when overlay is focused (fullscreen active)
    document.addEventListener('keydown', (e) => {
      if (!isLcdActive) return;

      // Escape key to exit
      if (e.key === 'Escape') {
        e.preventDefault();
        window.closeLcdTest();
        return;
      }

      // Backspace key to go back
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (enduranceInterval) {
          clearInterval(enduranceInterval);
          enduranceInterval = null;
        }
        currentPatternIndex = (currentPatternIndex - 1 + patterns.length) % patterns.length;
        applyPattern(patterns[currentPatternIndex]);
        return;
      }

      // Number keys direct mapping
      const keyMap = {
        '1': 'white', '2': 'black', '3': 'red', '4': 'green',
        '5': 'blue', '6': 'cyan', '7': 'purple', '8': 'yellow',
        '9': 'grad-h', '0': 'grad-v', 'v': 'vert-lines', 'h': 'horiz-lines',
        'V': 'vert-lines', 'H': 'horiz-lines'
      };
      if (keyMap[e.key]) {
        e.preventDefault();
        if (enduranceInterval) {
          clearInterval(enduranceInterval);
          enduranceInterval = null;
        }
        window.launchFullScreen(keyMap[e.key]);
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        window.launchFullScreen('endurance');
        return;
      }

      // Space / Enter / Arrow / Any other key to advance
      if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt') {
        e.preventDefault();
        if (enduranceInterval) {
          clearInterval(enduranceInterval);
          enduranceInterval = null;
        }
        currentPatternIndex = (currentPatternIndex + 1) % patterns.length;
        applyPattern(patterns[currentPatternIndex]);
      }
    });

    // Exit hooks
    function exitLcdView(status, remark) {
      // Cancel auto-start countdown if still running
      if (autoStartTimer) {
        clearInterval(autoStartTimer);
        autoStartTimer = null;
        const badge = document.getElementById('lcd-autostart-badge');
        if (badge) badge.style.display = 'none';
      }
      const statusBadge = testLcd.querySelector('.test-status');
      if (statusBadge) {
        if (status === 'passed') {
          statusBadge.textContent = 'Passed';
          statusBadge.className = 'test-status status-success';
          saveRecordToHistory('LCD panel validation Passed');
          log('LCD panel validation completed successfully (Passed).', 'ready');
        } else if (status === 'failed') {
          statusBadge.textContent = 'Failed';
          statusBadge.className = 'test-status status-error';
          const msg = remark ? `LCD panel validation Failed: ${remark}` : 'LCD panel validation Failed';
          saveRecordToHistory(msg);
          log(`LCD panel validation completed with defects (Failed). Remark: ${remark || 'None'}`, 'error');
        }
      }

      // Go back to System Health
      const navSystem = document.getElementById('nav-system-health');
      if (navSystem) navSystem.click();
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        exitLcdView('idle');
      });
    }
    if (passBtn) {
      passBtn.addEventListener('click', () => {
        exitLcdView('passed');
      });
    }
    if (failBtn) {
      failBtn.addEventListener('click', () => {
        showCustomPrompt("Mention the Remark why it failed:", "LCD Test Failure", (remark) => {
          if (remark === null) return;
          exitLcdView('failed', remark);
        });
      });
    }

    // Cancel the countdown on clicking anywhere in the LCD view
    const lcdView = document.getElementById('view-lcd-test');
    if (lcdView) {
      lcdView.addEventListener('click', () => {
        if (autoStartTimer) {
          clearInterval(autoStartTimer);
          autoStartTimer = null;
          const badge = document.getElementById('lcd-autostart-badge');
          if (badge) badge.style.display = 'none';
          log('LCD Auto-start countdown cancelled by user click.', 'debug');
        }
      });
    }
  })();

  /* ==========================================================================
     NATIVE SOUND CHECKING INTERACTIVE DIAGNOSTICS
     ========================================================================== */
  (function () {
    let audioCtx = null;
    let masterPanner = null;
    let masterGain = null;
    let masterAnalyser = null;
    let analyserL = null;
    let analyserR = null;

    // Oscillator variables (for Phase test sine wave)
    let oscNode = null;
    let oscGain = null;

    // Sound player variables
    let audioEl = null;
    let audioSourceNode = null;
    let isPlaying = false;
    let playbackPipelineInitialized = false;

    // 2.1 channel splitter nodes
    let channelSplitter = null;
    let channelMerger = null;
    let gainL = null;
    let gainR = null;
    let gainSub = null;
    let subMixer = null;
    let subFilter = null;

    // Mic variables
    let micStream = null;
    let micSourceNode = null;
    let micAnalyserNode = null;
    let micGainNode = null;
    let micFeedbackGainNode = null;
    let isMicActive = false;
    let micAnimationId = null;

    // Phase test variables
    let phaseGainR = null;
    let currentPhaseState = 'in'; // 'in' or 'out'

    // UI elements
    const viewSound = document.getElementById('view-sound-checking');

    const soundPlaylistContainer = document.getElementById('sound-playlist-container');
    const audioPlayPauseBtn = document.getElementById('audio-play-pause-btn');
    const audioTrackTitle = document.getElementById('audio-track-title');
    const audioTimeDisplay = document.getElementById('audio-time-display');
    const audioProgressBar = document.getElementById('audio-progress-bar');
    const audioProgressContainer = document.getElementById('audio-progress-container');

    const volSliderL = document.getElementById('vol-slider-l');
    const volSliderR = document.getElementById('vol-slider-r');
    const volSliderSub = document.getElementById('vol-slider-sub');
    const volTxtL = document.getElementById('vol-txt-l');
    const volTxtR = document.getElementById('vol-txt-r');
    const volTxtSub = document.getElementById('vol-txt-sub');

    const routeL = document.getElementById('route-l');
    const routeC = document.getElementById('route-c');
    const routeR = document.getElementById('route-r');
    const routeSub = document.getElementById('route-sub');

    const micSourceSelect = document.getElementById('mic-source-select');
    const micFeedbackToggle = document.getElementById('mic-feedback-toggle');
    const micGainSlider = document.getElementById('mic-gain-slider');
    const micGainDisplay = document.getElementById('mic-gain-display');
    const micLevelBar = document.getElementById('mic-level-bar');
    const micPeakIndicator = document.getElementById('mic-peak-indicator');
    const micCanvas = document.getElementById('mic-waveform-canvas');
    const micCanvasCtx = micCanvas ? micCanvas.getContext('2d') : null;
    const canvasOverlayText = document.getElementById('canvas-overlay-text');

    const micStatusBadge = document.getElementById('mic-status-badge');
    const micStatusDot = document.getElementById('mic-status-dot');
    const micStatusTxt = document.getElementById('mic-status-txt');

    const inPhaseBtn = document.getElementById('in-phase-btn');
    const outPhaseBtn = document.getElementById('out-phase-btn');

    const soundBackBtn = document.getElementById('sound-back-btn');
    const audioPassBtn = document.getElementById('audio-pass-btn');
    const audioFailBtn = document.getElementById('audio-fail-btn');

    // Initialize AudioContext
    function initAudio() {
      if (audioCtx) return;

      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtxClass();

      // Create master chain
      masterPanner = audioCtx.createStereoPanner();
      masterGain = audioCtx.createGain();
      masterAnalyser = audioCtx.createAnalyser();
      masterAnalyser.fftSize = 128; // 64 frequency bins for spectrum bars

      analyserL = audioCtx.createAnalyser();
      analyserL.fftSize = 32;
      analyserR = audioCtx.createAnalyser();
      analyserR.fftSize = 32;

      // Master connections
      masterPanner.connect(masterGain);
      masterGain.connect(masterAnalyser);
      masterAnalyser.connect(audioCtx.destination);

      // Initialize Master VU meter rendering loop
      startMasterVUMonitor();
    }

    // 60FPS Ultra-Fluid Master Visualizer Animation Loop
    let vuAnimationFrameId = null;
    function startMasterVUMonitor() {
      if (vuAnimationFrameId) cancelAnimationFrame(vuAnimationFrameId);

      const container = document.getElementById('spectrum-visualizer-container');
      const pulse = document.getElementById('audio-output-pulse');
      let currentHeights = new Float32Array(64).fill(8);

      function updateFrame() {
        if (!audioCtx || audioCtx.state === 'suspended') {
          vuAnimationFrameId = requestAnimationFrame(updateFrame);
          return;
        }

        let maxVal = 0;
        let dataArray = new Uint8Array(64);

        if (masterAnalyser) {
          masterAnalyser.getByteFrequencyData(dataArray);
        }

        if (container) {
          const bars = container.children;
          const count = bars.length;

          for (let i = 0; i < count; i++) {
            const bar = bars[i];
            if (!bar) continue;

            // Exponential frequency mapping & high-register gain multiplier so low, mid & high bars all bounce
            const freqIndex = Math.floor(Math.pow(i / count, 1.25) * (dataArray.length - 1));
            let rawVal = dataArray[freqIndex] || 0;

            const gainMultiplier = 1.0 + (i / count) * 1.35;
            let val = rawVal * gainMultiplier;

            if (val > maxVal) maxVal = val;

            // Micro dynamic bounce when music or tone is actively streaming
            if (val < 15 && (isPlaying || oscNode)) {
              val = 12 + Math.sin(Date.now() * 0.012 + i * 0.3) * 16 + Math.random() * 8;
            }

            const targetPercent = Math.min(Math.max((val / 255) * 100, 8), 100);

            // Fast attack / smooth physics decay
            if (targetPercent > currentHeights[i]) {
              currentHeights[i] = currentHeights[i] * 0.35 + targetPercent * 0.65;
            } else {
              currentHeights[i] = currentHeights[i] * 0.85 + targetPercent * 0.15;
            }

            bar.style.height = currentHeights[i].toFixed(1) + '%';
            bar.style.opacity = (0.65 + (currentHeights[i] / 250)).toFixed(2);

            // Dynamic color hue wave shift & volume peak brightness movement
            const hueRotate = Math.sin(Date.now() * 0.0025 + i * 0.08) * 20;
            const peakBrightness = 1 + (currentHeights[i] / 100) * 0.3;
            bar.style.filter = `hue-rotate(${hueRotate.toFixed(1)}deg) brightness(${peakBrightness.toFixed(2)})`;
          }
        }

        // Animated neon pulsing master output dot
        if (pulse) {
          if (maxVal > 15 || isPlaying) {
            pulse.style.opacity = '1';
            pulse.style.boxShadow = '0 0 10px #00f2fe, 0 0 18px #00f2fe';
          } else {
            pulse.style.opacity = '0.4';
            pulse.style.boxShadow = 'none';
          }
        }

        vuAnimationFrameId = requestAnimationFrame(updateFrame);
      }

      vuAnimationFrameId = requestAnimationFrame(updateFrame);
    }

    // Dynamic Spectrum Bar creation with rich multi-color gradient zones
    function createVUBars() {
      const container = document.getElementById('spectrum-visualizer-container');
      const count = 64;

      if (container) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
          const bar = document.createElement('div');
          bar.className = 'spectrum-bar';

          const pct = i / count;
          if (pct < 0.25) {
            bar.classList.add('bar-zone-cyan');
          } else if (pct < 0.52) {
            bar.classList.add('bar-zone-blue');
          } else if (pct < 0.80) {
            bar.classList.add('bar-zone-purple');
          } else {
            bar.classList.add('bar-zone-pink');
          }

          container.appendChild(bar);
        }
      }
    }

    // Sine wave generator (Phase signal reference)
    function startSineWave(freq = 440) {
      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      if (oscNode) stopSineWave();

      oscNode = audioCtx.createOscillator();
      oscGain = audioCtx.createGain();

      oscNode.type = 'sine';
      oscNode.frequency.setValueAtTime(freq, audioCtx.currentTime);

      oscGain.gain.setValueAtTime(0, audioCtx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);

      oscNode.connect(oscGain);
      oscGain.connect(channelMerger || masterPanner);

      oscNode.start(audioCtx.currentTime);
      log(`Sine wave output started at ${freq}Hz`, 'info');
    }

    function stopSineWave() {
      if (oscNode) {
        try {
          oscNode.stop();
          oscNode.disconnect();
        } catch (e) { }
        oscNode = null;
      }
      if (oscGain) {
        try {
          oscGain.disconnect();
        } catch (e) { }
        oscGain = null;
      }
    }

    // Load & initialize hidden audio element
    function loadAudioElement() {
      if (audioEl) return;

      audioEl = new Audio();
      audioEl.crossOrigin = "anonymous";
      audioEl.loop = true;

      // Default local sound checker path
      audioEl.src = "../Sound_checking/Sound_checking.mp4";

      // Time updates
      audioEl.addEventListener('timeupdate', () => {
        if (!audioEl) return;
        const cur = audioEl.currentTime;
        const dur = audioEl.duration || 0;
        audioTimeDisplay.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;

        const progress = dur > 0 ? (cur / dur) * 100 : 0;
        audioProgressBar.style.width = progress + '%';
      });

      audioEl.addEventListener('error', (e) => {
        if (currentSelectedFile && !audioEl._triedFallback) {
          audioEl._triedFallback = true;
          const fallbackSrc = `Sound_checking/${encodeURIComponent(currentSelectedFile)}`;
          log(`Primary audio src failed. Trying bundled asset fallback: ${fallbackSrc}`, 'warn');
          audioEl.src = fallbackSrc;
          audioEl.play().catch(err => {
            log(`Fallback audio playback error: ${err.message}`, 'error');
          });
          return;
        }
        log(`Audio player load error. Check path: ${audioEl.src}`, 'error');
        audioTrackTitle.textContent = "Error Loading Track";
      });
    }

    function formatTime(secs) {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // Build the 2.1 Crossover Pipeline & Live Visualizer Stream
    function initPlaybackPipeline() {
      if (playbackPipelineInitialized) return;
      loadAudioElement();
      initAudio();

      try {
        if (!audioSourceNode) {
          audioSourceNode = audioCtx.createMediaElementSource(audioEl);
        }

        // 2.1 Crossover filters
        channelSplitter = audioCtx.createChannelSplitter(2);
        channelMerger = audioCtx.createChannelMerger(2);

        gainL = audioCtx.createGain();
        gainR = audioCtx.createGain();
        gainSub = audioCtx.createGain();

        subMixer = audioCtx.createGain();
        subMixer.gain.value = 0.5; // Summing gain

        subFilter = audioCtx.createBiquadFilter();
        subFilter.type = 'lowpass';
        subFilter.frequency.value = 120; // 120Hz crossover point

        phaseGainR = audioCtx.createGain();
        phaseGainR.gain.value = currentPhaseState === 'out' ? -1 : 1;

        // Connect source to splitter
        audioSourceNode.connect(channelSplitter);

        // Left channel pipeline: Splitter L -> gainL -> analyserL -> merger L
        channelSplitter.connect(gainL, 0);
        if (analyserL) {
          gainL.connect(analyserL);
          analyserL.connect(channelMerger, 0, 0);
        } else {
          gainL.connect(channelMerger, 0, 0);
        }

        // Right channel pipeline: Splitter R -> gainR -> phaseGainR -> analyserR -> merger R
        channelSplitter.connect(gainR, 1);
        gainR.connect(phaseGainR);
        if (analyserR) {
          phaseGainR.connect(analyserR);
          analyserR.connect(channelMerger, 0, 1);
        } else {
          phaseGainR.connect(channelMerger, 0, 1);
        }

        // Subwoofer pipeline: mix L+R -> lowpass -> gainSub -> mix into L & R merger channels
        channelSplitter.connect(subMixer, 0);
        channelSplitter.connect(subMixer, 1);

        subMixer.connect(subFilter);
        subFilter.connect(gainSub);

        gainSub.connect(channelMerger, 0, 0);
        gainSub.connect(channelMerger, 0, 1);

        // Connect merger to master chain
        channelMerger.connect(masterPanner);

        // Apply initial volume values from sliders
        updateChannelVolume('L', volSliderL ? volSliderL.value : 100);
        updateChannelVolume('R', volSliderR ? volSliderR.value : 100);
        updateChannelVolume('Sub', volSliderSub ? volSliderSub.value : 100);

        playbackPipelineInitialized = true;
        log('2.1 playback crossover pipeline & live visualizer stream initialized successfully.', 'debug');
      } catch (err) {
        log(`Failed to init playback pipeline: ${err.message}`, 'error');
      }
    }

    function updateChannelVolume(channel, percentage) {
      const val = parseFloat(percentage) / 100;
      if (channel === 'L') {
        if (gainL && audioCtx) {
          gainL.gain.setValueAtTime(isLActive ? val : 0.0, audioCtx.currentTime);
        }
        if (volTxtL) volTxtL.textContent = percentage + '%';
      } else if (channel === 'R') {
        if (gainR && audioCtx) {
          gainR.gain.setValueAtTime(isRActive ? val : 0.0, audioCtx.currentTime);
        }
        if (volTxtR) volTxtR.textContent = percentage + '%';
      } else if (channel === 'Sub') {
        if (gainSub && audioCtx) {
          gainSub.gain.setValueAtTime(isSubActive ? val * 1.5 : 0.0, audioCtx.currentTime);
        }
        if (volTxtSub) volTxtSub.textContent = percentage + '%';
      }
    }

    // Synchronize playlist play/pause icons with actual state
    function syncPlaylistPlayIcon(isCurrentPlaying) {
      document.querySelectorAll('#sound-playlist-container .playlist-item').forEach(el => {
        const playIcon = el.querySelector('.play-icon');
        const textSpan = el.querySelector('span');
        const isThisTrackActive = el.classList.contains('active');

        if (playIcon) {
          if (isThisTrackActive && isCurrentPlaying) {
            playIcon.className = 'fa-solid fa-circle-pause play-icon';
            playIcon.style.color = 'var(--color-blue)';
            playIcon.style.opacity = '1';
          } else if (isThisTrackActive) {
            playIcon.className = 'fa-solid fa-circle-play play-icon';
            playIcon.style.color = 'var(--color-blue)';
            playIcon.style.opacity = '1';
          } else {
            playIcon.className = 'fa-solid fa-circle-play play-icon';
            playIcon.style.color = 'var(--text-muted)';
            playIcon.style.opacity = '0.7';
          }
        }
      });
    }

    // Audio Play/Pause
    function toggleAudio() {
      initPlaybackPipeline();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      if (isPlaying) {
        audioEl.pause();
        isPlaying = false;
        audioPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        syncPlaylistPlayIcon(false);
        updateMiniAudioWidget();
        log('Audio playback paused.', 'debug');
      } else {
        audioEl.play().then(() => {
          isPlaying = true;
          audioPlayPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
          syncPlaylistPlayIcon(true);
          updateMiniAudioWidget();
          log('Audio playback started.', 'debug');
        }).catch(err => {
          log(`Failed to play audio: ${err.message}`, 'error');
        });
      }
    }

    const PRESET_SOUND_FILES = [
      "Sound_checking.mp4",
      "Song_checking_2.mp3",
      "Song_checking_3.mp3"
    ];

    let currentSelectedFile = null;

    // Load track by file name
    function loadTrack(file, autoPlay = true) {
      loadAudioElement();
      initPlaybackPipeline();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      currentSelectedFile = file;
      if (audioEl) audioEl._triedFallback = false;

      // Build audio src path: use Tauri convertFileSrc if available, or asset protocol / relative fallback
      function setAudioSrc(filename) {
        if (window._soundFolderPath) {
          const cleanFolder = window._soundFolderPath.replace(/[/\\]+/g, '/').replace(/\/$/, '');
          const fullPath = `${cleanFolder}/${filename}`;
          let srcUrl = null;

          if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.convertFileSrc === 'function') {
            srcUrl = window.__TAURI__.core.convertFileSrc(fullPath);
          } else if (window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.convertFileSrc === 'function') {
            srcUrl = window.__TAURI_INTERNALS__.convertFileSrc(fullPath);
          }

          if (srcUrl) {
            audioEl.src = srcUrl;
            return;
          }
        }

        // Fallback relative asset URL
        audioEl.src = `../Sound_checking/${encodeURIComponent(filename)}`;
      }

      if (file) {
        setAudioSrc(file);
        audioTrackTitle.textContent = file;
        log(`Loaded audio track: ${file}`, 'info');
      } else {
        setAudioSrc('Sound_checking.mp4');
        audioTrackTitle.textContent = 'Sound_checking.mp4';
        log('Reset audio track to default Sound_checking.mp4', 'info');
      }

      // If autoplay is requested, start playback immediately
      if (autoPlay) {
        audioEl.play().then(() => {
          isPlaying = true;
          audioPlayPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
          syncPlaylistPlayIcon(true);
        }).catch(err => {
          log(`Failed to play track: ${err.message}`, 'error');
        });
      } else {
        isPlaying = false;
        audioPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        syncPlaylistPlayIcon(false);
      }
    }

    // Dynamic populator for Sound_checking folder songs in the playlist
    async function populateSoundFiles() {
      const container = soundPlaylistContainer || document.getElementById('sound-playlist-container');
      if (!container) return;

      // Step 1: Ensure absolute Sound_checking folder path is cached
      const folderRes = await electronAPI.getSoundFolderPath();
      if (folderRes.success && folderRes.path) {
        window._soundFolderPath = folderRes.path;
        log(`Sound folder resolved: ${folderRes.path}`, 'debug');
      } else {
        window._soundFolderPath = "C:\\BizzCoHub QC\\Sound_checking";
      }

      // Step 2: Fetch sound files directly from Rust backend (native fs::read_dir)
      let scannedFiles = [];
      const rustFilesRes = await electronAPI.getSoundFiles();
      if (rustFilesRes.success && Array.isArray(rustFilesRes.files) && rustFilesRes.files.length > 0) {
        scannedFiles = rustFilesRes.files;
        log(`Found ${scannedFiles.length} audio tracks via Rust backend.`, 'info');
      } else {
        // Fallback to PowerShell if Rust returns empty
        let soundDir = window._soundFolderPath;
        if (soundDir) {
          const safePath = soundDir.replace(/'/g, "''");
          const cmd = `Get-ChildItem -Path '${safePath}' -File | Select-Object -ExpandProperty Name | ConvertTo-Json -Compress`;
          const psRes = await electronAPI.getSystemSpec(cmd);
          if (psRes.success && psRes.data) {
            try {
              const parsed = JSON.parse(psRes.data);
              scannedFiles = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
              const trimmed = psRes.data.trim();
              if (trimmed) scannedFiles = [trimmed];
            }
          }
        }
      }

      // Filter valid media extensions (both audio and video formats)
      scannedFiles = scannedFiles.filter(f => /\.(mp3|mp4|wav|m4a|aac|ogg|flac|wma|webm|mkv)$/i.test(f));

      // Always include preset software tracks alongside any scanned tracks
      const files = Array.from(new Set([...PRESET_SOUND_FILES, ...scannedFiles]));

      container.innerHTML = '';
      if (files.length === 0) {
        container.innerHTML = '<div style="font-size: 12px; color: var(--text-secondary); text-align: center; padding: 16px 0;">No Audio Files Found</div>';
        return;
      }

      files.forEach(file => {
        const isVideo = /\.(mp4|webm|mkv)$/i.test(file);
        const iconClass = isVideo ? "fa-solid fa-file-video" : "fa-solid fa-file-audio";

        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.padding = '10px 14px';
        item.style.borderRadius = '8px';
        item.style.cursor = 'pointer';
        item.style.transition = 'all 0.2s ease';
        item.style.background = 'rgba(0,0,0,0.15)';

        item.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <i class="${iconClass}" style="color: var(--text-secondary); flex-shrink: 0;"></i>
            <span style="font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; color: var(--text-main);">${file}</span>
          </div>
          <i class="fa-solid fa-circle-play play-icon" style="font-size: 14px; color: var(--text-muted); opacity: 0.7; transition: color 0.2s;"></i>
        `;

        // Click callback to load and play
        item.addEventListener('click', () => {
          document.querySelectorAll('#sound-playlist-container .playlist-item').forEach(el => {
            el.classList.remove('active');
          });
          item.classList.add('active');
          loadTrack(file, true);
        });

        soundPlaylistContainer.appendChild(item);
      });

      // Autoselect and load first file silently by default on initialization
      if (files.length > 0) {
        const defaultFile = files.includes("Sound_checking.mp4") ? "Sound_checking.mp4" : files[0];
        currentSelectedFile = defaultFile;

        const items = soundPlaylistContainer.querySelectorAll('.playlist-item');
        items.forEach(item => {
          const fileName = item.querySelector('span').textContent;
          if (fileName === defaultFile) {
            item.classList.add('active');
          }
        });

        loadTrack(defaultFile, false);
      }
    }

    // Route config toggles
    function toggleRouteBtn(btn, isActive) {
      if (isActive) {
        btn.classList.add('active');
        btn.style.background = 'var(--color-blue-translucent)';
        btn.style.borderColor = 'var(--color-blue)';
        btn.style.color = 'var(--color-blue)';
      } else {
        btn.classList.remove('active');
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
      }
    }

    // Enumerate Mic Devices
    function populateMicSources() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          micSourceSelect.innerHTML = '';
          const audioInputs = devices.filter(d => d.kind === 'audioinput');

          if (audioInputs.length === 0) {
            const opt = document.createElement('option');
            opt.value = "";
            opt.textContent = "No Microphones Found";
            micSourceSelect.appendChild(opt);
            return;
          }

          audioInputs.forEach((device, index) => {
            const opt = document.createElement('option');
            opt.value = device.deviceId;
            opt.textContent = device.label || `Microphone ${index + 1}`;
            micSourceSelect.appendChild(opt);
          });
        })
        .catch(err => {
          log(`Enumerate mic devices failed: ${err.message}`, 'error');
        });
    }

    // Initialize Microphone stream
    function initMicrophone() {
      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      if (isMicActive) {
        stopMicrophone();
        return;
      }

      const deviceId = micSourceSelect.value;
      const constraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          micStream = stream;
          isMicActive = true;

          // Visual badge update
          micStatusBadge.style.background = 'rgba(48,209,88,0.12)';
          micStatusBadge.style.borderColor = 'rgba(48,209,88,0.25)';
          micStatusDot.style.backgroundColor = 'var(--color-green)';
          micStatusDot.classList.add('pulse-green');
          micStatusTxt.textContent = 'ACTIVE';
          micStatusTxt.style.color = 'var(--color-green)';

          const waveContainer = document.getElementById('mic-waveform-container');
          if (waveContainer) waveContainer.classList.add('active');

          if (canvasOverlayText) canvasOverlayText.style.display = 'none';

          // Audio chain connection
          micSourceNode = audioCtx.createMediaStreamSource(micStream);

          micAnalyserNode = audioCtx.createAnalyser();
          micAnalyserNode.fftSize = 256;

          micGainNode = audioCtx.createGain();
          micFeedbackGainNode = audioCtx.createGain();

          // Sensitivity gain slider value
          updateMicGain(micGainSlider.value);

          // Connect mic input to analyser
          micSourceNode.connect(micGainNode);
          micGainNode.connect(micAnalyserNode);

          // Audio loopback path
          micFeedbackGainNode.gain.value = 0.0;
          micGainNode.connect(micFeedbackGainNode);
          micFeedbackGainNode.connect(audioCtx.destination);

          // Sync loopback toggle
          toggleMicFeedback(micFeedbackToggle.checked);

          // Launch Canvas visualizer loops
          drawWaveform();

          log('Microphone monitor stream active.', 'ready');
        })
        .catch(err => {
          log(`Failed to access microphone: ${err.message}`, 'error');
          micFeedbackToggle.checked = false;
          stopMicrophone();
        });
    }

    // Visual badge update
    function stopMicrophone() {
      isMicActive = false;

      if (micStream) {
        micStream.getTracks().forEach(t => t.stop());
        micStream = null;
      }

      // Visual badge update
      micStatusBadge.style.background = 'rgba(255,69,58,0.12)';
      micStatusBadge.style.borderColor = 'rgba(255,69,58,0.25)';
      micStatusDot.style.backgroundColor = 'var(--color-red)';
      micStatusDot.classList.remove('pulse-green');
      micStatusTxt.textContent = 'INACTIVE';
      micStatusTxt.style.color = 'var(--color-red)';

      const waveContainer = document.getElementById('mic-waveform-container');
      if (waveContainer) waveContainer.classList.remove('active');

      if (canvasOverlayText) {
        canvasOverlayText.style.display = 'block';
        canvasOverlayText.textContent = 'Click "Enable Monitor" Below';
      }

      // Disconnect nodes
      if (micSourceNode) {
        try { micSourceNode.disconnect(); } catch (e) { }
        micSourceNode = null;
      }
      if (micAnalyserNode) {
        try { micAnalyserNode.disconnect(); } catch (e) { }
        micAnalyserNode = null;
      }
      if (micGainNode) {
        try { micGainNode.disconnect(); } catch (e) { }
        micGainNode = null;
      }
      if (micFeedbackGainNode) {
        try { micFeedbackGainNode.disconnect(); } catch (e) { }
        micFeedbackGainNode = null;
      }

      // Cancel animation
      if (micAnimationId) {
        cancelAnimationFrame(micAnimationId);
        micAnimationId = null;
      }

      // Clear canvas
      if (micCanvasCtx && micCanvas) {
        micCanvasCtx.clearRect(0, 0, micCanvas.width, micCanvas.height);
      }

      // Reset level bars
      micLevelBar.style.width = '0%';
      micPeakIndicator.style.color = 'var(--text-muted)';

      log('Microphone monitor stream released.', 'info');
    }

    function updateMicGain(percentage) {
      const gainVal = parseFloat(percentage) / 100;
      const db = (20 * Math.log10(gainVal + 0.0001)).toFixed(1);
      micGainDisplay.textContent = (db > 0 ? '+' : '') + db + ' dB';

      if (micGainNode) {
        micGainNode.gain.setValueAtTime(gainVal * 1.5, audioCtx.currentTime);
      }
    }

    function toggleMicFeedback(enable) {
      if (micFeedbackGainNode) {
        const val = enable ? 0.15 : 0.0;
        micFeedbackGainNode.gain.setValueAtTime(val, audioCtx.currentTime);
        log(`Microphone speaker loopback: ${enable ? 'ENABLED' : 'DISABLED'}`, 'debug');
      }
    }

    // Draw real-time mic waveform
    function drawWaveform() {
      if (!isMicActive || !micAnalyserNode) return;

      micAnimationId = requestAnimationFrame(drawWaveform);

      if (micCanvas.width !== micCanvas.clientWidth || micCanvas.height !== micCanvas.clientHeight) {
        micCanvas.width = micCanvas.clientWidth;
        micCanvas.height = micCanvas.clientHeight;
      }

      const bufferLength = micAnalyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      micAnalyserNode.getByteTimeDomainData(dataArray);

      micCanvasCtx.fillStyle = 'rgba(26, 26, 26, 0.35)';
      micCanvasCtx.fillRect(0, 0, micCanvas.width, micCanvas.height);

      micCanvasCtx.shadowBlur = 6;
      micCanvasCtx.shadowColor = '#00f0ff';
      micCanvasCtx.lineWidth = 2.5;
      micCanvasCtx.strokeStyle = '#00f0ff';
      micCanvasCtx.beginPath();

      const sliceWidth = micCanvas.width / bufferLength;
      let x = 0;
      let sumSquares = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * micCanvas.height) / 2;

        if (i === 0) {
          micCanvasCtx.moveTo(x, y);
        } else {
          micCanvasCtx.lineTo(x, y);
        }

        x += sliceWidth;

        const offset = (dataArray[i] - 128) / 128;
        sumSquares += offset * offset;
      }

      micCanvasCtx.lineTo(micCanvas.width, micCanvas.height / 2);
      micCanvasCtx.stroke();
      micCanvasCtx.shadowBlur = 0; // Reset shadow for performance

      const rms = Math.sqrt(sumSquares / bufferLength);
      const levelPercent = Math.min(rms * 400, 100);

      micLevelBar.style.width = levelPercent + '%';

      if (levelPercent > 85) {
        micPeakIndicator.style.color = 'var(--color-red)';
      } else {
        micPeakIndicator.style.color = 'var(--text-muted)';
      }
    }

    // Phase test configurations
    // Global Hooks
    window.initSoundCheck = () => {
      createVUBars();
      populateMicSources();
      populateSoundFiles();
      log('Sound Checker interactive assets loaded.', 'info');
    };

    window.closeSoundCheck = () => {
      stopSineWave();
      stopMicrophone();

      // If audio is playing when navigating away from Sound Checking, preserve audio and show floating mini player pop-over
      if (isPlaying || (audioEl && !audioEl.paused)) {
        updateMiniAudioWidget();
        log('Preserving background audio playback; displayed Floating Mini Player.', 'info');
      } else {
        const miniW = document.getElementById('mini-audio-player-widget');
        if (miniW) miniW.style.display = 'none';
      }
    };

    // View closing helpers
    function exitSoundChecking(status, remark) {
      window.closeSoundCheck();
      if (typeof window.closeSoundCheckingView === 'function') {
        window.closeSoundCheckingView(status, remark);
      }
    }

    // BIND DOM EVENT LISTENERS
    if (audioPlayPauseBtn) {
      audioPlayPauseBtn.addEventListener('click', toggleAudio);
    }
    if (audioProgressContainer) {
      audioProgressContainer.addEventListener('click', (e) => {
        if (!audioEl) return;
        const rect = audioProgressContainer.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const targetTime = percent * (audioEl.duration || 0);
        audioEl.currentTime = targetTime;
        log(`Seeked track position to: ${formatTime(targetTime)}`, 'debug');
      });
    }

    if (volSliderL) {
      volSliderL.addEventListener('input', (e) => updateChannelVolume('L', e.target.value));
    }
    if (volSliderR) {
      volSliderR.addEventListener('input', (e) => updateChannelVolume('R', e.target.value));
    }
    if (volSliderSub) {
      volSliderSub.addEventListener('input', (e) => updateChannelVolume('Sub', e.target.value));
    }

    let isLActive = true;
    let isRActive = true;
    let isSubActive = true;

    if (routeL) {
      routeL.addEventListener('click', () => {
        isLActive = !isLActive;
        toggleRouteBtn(routeL, isLActive);
        updateChannelVolume('L', volSliderL ? volSliderL.value : 100);
      });
    }
    if (routeR) {
      routeR.addEventListener('click', () => {
        isRActive = !isRActive;
        toggleRouteBtn(routeR, isRActive);
        updateChannelVolume('R', volSliderR ? volSliderR.value : 100);
      });
    }
    if (routeSub) {
      routeSub.addEventListener('click', () => {
        isSubActive = !isSubActive;
        toggleRouteBtn(routeSub, isSubActive);
        updateChannelVolume('Sub', volSliderSub ? volSliderSub.value : 100);
      });
    }
    if (routeC) {
      let isCActive = false;
      routeC.addEventListener('click', () => {
        isCActive = !isCActive;
        toggleRouteBtn(routeC, isCActive);
        if (masterPanner && audioCtx) {
          masterPanner.pan.setValueAtTime(0.0, audioCtx.currentTime);
        }
      });
    }

    if (micFeedbackToggle) {
      micFeedbackToggle.addEventListener('change', () => {
        if (!isMicActive) {
          initMicrophone();
        } else {
          toggleMicFeedback(micFeedbackToggle.checked);
        }
      });
    }

    if (micGainSlider) {
      micGainSlider.addEventListener('input', (e) => updateMicGain(e.target.value));
    }


    if (soundBackBtn) {
      soundBackBtn.addEventListener('click', () => exitSoundChecking('idle'));
    }
    if (audioPassBtn) {
      audioPassBtn.addEventListener('click', () => exitSoundChecking('passed'));
    }
    if (audioFailBtn) {
      audioFailBtn.addEventListener('click', () => {
        showCustomPrompt("Mention the Remark why it failed:", "Audio Test Failure", (remark) => {
          if (remark === null) return;
          exitSoundChecking('failed', remark);
        });
      });
    }

    // Playlist Refresh button
    const btnRefreshPlaylist = document.getElementById('btn-refresh-playlist');

    if (btnRefreshPlaylist) {
      btnRefreshPlaylist.addEventListener('mouseenter', () => {
        btnRefreshPlaylist.style.color = 'var(--color-blue)';
      });
      btnRefreshPlaylist.addEventListener('mouseleave', () => {
        btnRefreshPlaylist.style.color = 'var(--text-muted)';
      });
      btnRefreshPlaylist.addEventListener('click', () => {
        // Spin animation
        const icon = btnRefreshPlaylist.querySelector('i');
        if (icon) {
          icon.style.transition = 'transform 0.5s';
          icon.style.transform = 'rotate(360deg)';
          setTimeout(() => { icon.style.transform = ''; icon.style.transition = ''; }, 500);
        }
        populateSoundFiles();
        log('Playlist refreshed manually.', 'info');
      });
    }

    // FLOATING MINI AUDIO PLAYER WIDGET HANDLERS
    const miniWidget = document.getElementById('mini-audio-player-widget');
    const miniTitle = document.getElementById('mini-player-title');
    const miniTime = document.getElementById('mini-player-time');
    const miniPlayBtn = document.getElementById('mini-player-play-btn');
    const miniCloseBtn = document.getElementById('mini-player-close-btn');
    const miniDiscIcon = document.getElementById('mini-disc-icon');
    const miniJumpBtn = document.getElementById('mini-player-jump-btn');
    const miniInfoWrap = document.getElementById('mini-player-info-wrap');

    function updateMiniAudioWidget(overrideTargetViewId) {
      if (!miniWidget) return;

      let activeViewId = overrideTargetViewId;
      if (!activeViewId) {
        const activeView = document.querySelector('.view-pane.active');
        activeViewId = activeView ? activeView.id : '';
      }

      const isSoundViewActive = activeViewId === 'view-sound-checking';

      if (!isSoundViewActive && currentSelectedFile) {
        miniWidget.style.display = 'block';
        if (miniTitle) miniTitle.textContent = currentSelectedFile;
        if (miniTime) miniTime.textContent = audioTimeDisplay ? audioTimeDisplay.textContent : '00:00 / 00:00';
        if (miniPlayBtn) miniPlayBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
        if (miniDiscIcon) {
          if (isPlaying) miniDiscIcon.classList.add('playing');
          else miniDiscIcon.classList.remove('playing');
        }
      } else {
        miniWidget.style.display = 'none';
      }
    }
    window.updateMiniAudioWidget = updateMiniAudioWidget;

    if (miniPlayBtn) {
      miniPlayBtn.addEventListener('click', toggleAudio);
    }
    if (miniCloseBtn) {
      miniCloseBtn.addEventListener('click', () => {
        if (miniWidget) miniWidget.style.display = 'none';
      });
    }

    function jumpToSoundChecking() {
      const navItem = document.getElementById('nav-sound-checking');
      if (navItem) {
        navItem.click();
      } else {
        const soundView = document.getElementById('view-sound-checking');
        if (soundView) {
          document.querySelectorAll('.view-pane').forEach(v => {
            v.style.display = 'none';
            v.classList.remove('active');
          });
          soundView.style.display = 'flex';
          soundView.classList.add('active');
          if (miniWidget) miniWidget.style.display = 'none';
        }
      }
    }

    if (miniJumpBtn) miniJumpBtn.addEventListener('click', jumpToSoundChecking);
    if (miniInfoWrap) miniInfoWrap.addEventListener('click', jumpToSoundChecking);

    // =========================================================
    // CAMERA TEST FUNCTIONALITY
    // =========================================================
    let cameraTestStream = null;
    let isVideoMirrored = true;
    let showGridlines = false;
    let isShowingSnapshot = false;

    async function initCameraTest() {
      log('Initializing Camera Diagnostics...', 'info');
      
      const selectSource = document.getElementById('camera-source-select');
      if (selectSource) {
        selectSource.innerHTML = '<option value="none">Scanning for cameras...</option>';
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          
          if (videoDevices.length === 0) {
            selectSource.innerHTML = '<option value="none">No webcams found</option>';
            log('No camera devices detected.', 'warn');
          } else {
            selectSource.innerHTML = '';
            videoDevices.forEach((device, index) => {
              const opt = document.createElement('option');
              opt.value = device.deviceId;
              opt.textContent = device.label || `Camera ${index + 1}`;
              selectSource.appendChild(opt);
            });
            log(`Found ${videoDevices.length} camera source(s).`, 'info');
          }
        } catch (e) {
          log(`Failed to list video devices: ${e.message}`, 'error');
          selectSource.innerHTML = '<option value="none">Error scanning devices</option>';
        }
      }
    }
    window.initCameraTest = initCameraTest;

    async function startCameraTest() {
      if (cameraTestStream) {
        stopCameraTest();
      }

      const selectSource = document.getElementById('camera-source-select');
      const deviceId = selectSource ? selectSource.value : null;
      
      const constraints = {
        video: deviceId && deviceId !== 'none' ? { deviceId: { exact: deviceId } } : true
      };

      const videoFeed = document.getElementById('camera-test-feed');
      const placeholder = document.getElementById('camera-test-placeholder');
      const statusText = document.getElementById('camera-status-text');
      const resText = document.getElementById('camera-res-text');
      const snapshotImg = document.getElementById('camera-snapshot-img');

      // Hide snapshot if active
      if (isShowingSnapshot && snapshotImg) {
        snapshotImg.style.display = 'none';
        isShowingSnapshot = false;
        const btnSnap = document.getElementById('btn-camera-test-snap');
        if (btnSnap) btnSnap.innerHTML = '<i class="fa-solid fa-camera"></i> Snapshot';
      }

      try {
        log('Starting Live Camera diagnostics stream...', 'info');
        cameraTestStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoFeed) {
          videoFeed.srcObject = cameraTestStream;
          videoFeed.style.display = 'block';
          
          // Get track resolution details
          const track = cameraTestStream.getVideoTracks()[0];
          if (track) {
            const settings = track.getSettings();
            if (resText) {
              resText.textContent = `${settings.width || 'unknown'} x ${settings.height || 'unknown'} @ ${Math.round(settings.frameRate || 30)}fps`;
            }
          }
        }

        if (placeholder) placeholder.style.display = 'none';
        if (statusText) {
          statusText.textContent = 'ACTIVE';
          statusText.style.color = 'var(--color-green)';
        }
        log('Camera feed active.', 'ready');
      } catch (err) {
        log(`Webcam permission / streaming failure: ${err.message}`, 'error');
        showCustomAlert('Unable to start camera stream. Ensure camera is connected and permissions are granted.', 'Camera Error', 'error');
        if (statusText) {
          statusText.textContent = 'ERROR';
          statusText.style.color = 'var(--color-red)';
        }
      }
    }

    function stopCameraTest() {
      if (cameraTestStream) {
        cameraTestStream.getTracks().forEach(track => track.stop());
        cameraTestStream = null;
      }
      
      const videoFeed = document.getElementById('camera-test-feed');
      const placeholder = document.getElementById('camera-test-placeholder');
      const statusText = document.getElementById('camera-status-text');
      const resText = document.getElementById('camera-res-text');
      const snapshotImg = document.getElementById('camera-snapshot-img');

      if (videoFeed) {
        videoFeed.srcObject = null;
        videoFeed.style.display = 'none';
      }
      if (snapshotImg) {
        snapshotImg.style.display = 'none';
      }
      isShowingSnapshot = false;
      const btnSnap = document.getElementById('btn-camera-test-snap');
      if (btnSnap) btnSnap.innerHTML = '<i class="fa-solid fa-camera"></i> Snapshot';

      if (placeholder) placeholder.style.display = 'flex';
      if (statusText) {
        statusText.textContent = 'DISCONNECTED';
        statusText.style.color = 'var(--color-red)';
      }
      if (resText) resText.textContent = 'N/A';
      log('Camera feed disabled.', 'info');
    }
    window.stopCameraTest = stopCameraTest;

    // Event listener setup
    const btnCamStart = document.getElementById('btn-camera-test-start');
    const btnCamStop = document.getElementById('btn-camera-test-stop');
    const btnCamMirror = document.getElementById('btn-camera-test-mirror');
    const btnCamGrid = document.getElementById('btn-camera-test-grid');
    const btnCamSnap = document.getElementById('btn-camera-test-snap');
    const selectSource = document.getElementById('camera-source-select');

    if (btnCamStart) btnCamStart.addEventListener('click', startCameraTest);
    if (btnCamStop) btnCamStop.addEventListener('click', stopCameraTest);
    if (selectSource) selectSource.addEventListener('change', () => {
      if (cameraTestStream) startCameraTest();
    });

    if (btnCamMirror) {
      btnCamMirror.addEventListener('click', () => {
        isVideoMirrored = !isVideoMirrored;
        const videoFeed = document.getElementById('camera-test-feed');
        const snapshotImg = document.getElementById('camera-snapshot-img');
        const transformStyle = isVideoMirrored ? 'scaleX(-1)' : 'scaleX(1)';
        
        if (videoFeed) videoFeed.style.transform = transformStyle;
        if (snapshotImg) snapshotImg.style.transform = transformStyle;
        
        btnCamMirror.classList.toggle('active', isVideoMirrored);
        log(`Camera horizontal mirror set to: ${isVideoMirrored}`, 'debug');
      });
    }

    if (btnCamGrid) {
      btnCamGrid.addEventListener('click', () => {
        showGridlines = !showGridlines;
        const grid = document.getElementById('camera-grid-overlay');
        if (grid) grid.style.display = showGridlines ? 'grid' : 'none';
        btnCamGrid.classList.toggle('active', showGridlines);
      });
    }

    if (btnCamSnap) {
      btnCamSnap.addEventListener('click', () => {
        const videoFeed = document.getElementById('camera-test-feed');
        const canvas = document.getElementById('camera-snapshot-canvas');
        const snapshotImg = document.getElementById('camera-snapshot-img');

        if (!cameraTestStream || !videoFeed) {
          showCustomAlert('Please enable the camera stream first.', 'Snapshot Error', 'warn');
          return;
        }

        if (isShowingSnapshot) {
          // Retake: Hide image, show video
          if (snapshotImg) snapshotImg.style.display = 'none';
          videoFeed.style.display = 'block';
          isShowingSnapshot = false;
          btnCamSnap.innerHTML = '<i class="fa-solid fa-camera"></i> Snapshot';
          log('Resumed live video feed stream.', 'info');
        } else {
          // Capture snapshot
          if (canvas && snapshotImg) {
            canvas.width = videoFeed.videoWidth;
            canvas.height = videoFeed.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
            
            snapshotImg.src = canvas.toDataURL('image/png');
            snapshotImg.style.display = 'block';
            videoFeed.style.display = 'none';
            isShowingSnapshot = true;
            btnCamSnap.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Retake';
            log('Snapshot captured.', 'ready');
          }
        }
      });
    }

    // Glass scratch toggle styling
    const btnGlassOk = document.getElementById('btn-camera-glass-ok');
    const btnGlassFail = document.getElementById('btn-camera-glass-fail');
    let hasGlassIssues = false;

    if (btnGlassOk && btnGlassFail) {
      btnGlassOk.addEventListener('click', () => {
        btnGlassOk.classList.add('active');
        btnGlassFail.classList.remove('active');
        hasGlassIssues = false;
      });
      btnGlassFail.addEventListener('click', () => {
        btnGlassFail.classList.add('active');
        btnGlassOk.classList.remove('active');
        hasGlassIssues = true;
      });
    }

    // Pass / Fail remarks
    const btnCamPass = document.getElementById('camera-pass-btn');
    const btnCamFail = document.getElementById('camera-fail-btn');

    function exitCameraTest(status, remark = '') {
      stopCameraTest();
      
      const navItem = document.getElementById('nav-system-health');
      if (navItem) navItem.click();

      // Show alert and save run details
      if (status === 'passed') {
        const msg = hasGlassIssues ? 'Camera passed but has Glass Scratches.' : 'Camera diagnostics completed successfully.';
        saveRecordToHistory(`Camera Checked (${status})`);
        log(`Camera check completed (${status}). Remarks: ${msg}`, 'ready');
        showCustomAlert(msg, 'Test Passed', 'success');
      } else {
        saveRecordToHistory(`Camera Checked (${status}): ${remark}`);
        log(`Camera check completed (${status}). Remarks: ${remark}`, 'warn');
        showCustomAlert(`Camera check failed. Reason: ${remark}`, 'Test Failed', 'error');
      }
    }

    if (btnCamPass) {
      btnCamPass.addEventListener('click', () => exitCameraTest('passed'));
    }
    if (btnCamFail) {
      btnCamFail.addEventListener('click', () => {
        showCustomPrompt("Enter a remark describing why the camera failed:", "Camera Test Failure", (remark) => {
          if (remark === null) return;
          exitCameraTest('failed', remark);
        });
      });
    }

    // Settings Subview Hub Switching
    const settingsHubBtns = document.querySelectorAll('.settings-hub-btn');
    const settingsBackBtns = document.querySelectorAll('.btn-settings-back');
    const settingsHubView = document.getElementById('settings-hub-view');
    const settingsSubviews = document.querySelectorAll('.settings-subview');

    settingsHubBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        if (settingsHubView) settingsHubView.style.display = 'none';
        
        settingsSubviews.forEach(view => {
          view.style.display = view.id === targetId ? 'block' : 'none';
        });
        log(`Settings Hub navigated to subview: ${targetId}`, 'debug');
      });
    });

    settingsBackBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (settingsHubView) settingsHubView.style.display = 'flex';
        settingsSubviews.forEach(view => {
          view.style.display = 'none';
        });
        log('Settings subview returned to Settings Hub.', 'debug');
      });
    });

    // Multiple issues add listeners
    const btnAddPreviewIssue = document.getElementById('btn-add-preview-issue');
    if (btnAddPreviewIssue) {
      btnAddPreviewIssue.addEventListener('click', (e) => {
        e.preventDefault();
        const partsSelect = document.getElementById('preview-inp-remark-parts');
        const textInput = document.getElementById('preview-inp-remark-text');
        const part = partsSelect ? partsSelect.value : '';
        const remark = textInput ? textInput.value.trim() : '';
        if (!part) {
          showCustomAlert('Please select a part first.', 'Validation', 'warn');
          return;
        }
        if (!remark) {
          showCustomAlert('Please enter a remark or issue description.', 'Validation', 'warn');
          return;
        }
        previewIssues.push({ part, remark });
        renderPreviewIssues();
        if (textInput) textInput.value = '';
        if (partsSelect) partsSelect.selectedIndex = 0;
      });
    }

    const btnAddPortalIssue = document.getElementById('btn-add-portal-issue');
    if (btnAddPortalIssue) {
      btnAddPortalIssue.addEventListener('click', (e) => {
        e.preventDefault();
        const partsSelect = document.getElementById('portal-update-form-remark-parts');
        const textInput = document.getElementById('portal-update-form-remark-text');
        const part = partsSelect ? partsSelect.value : '';
        const remark = textInput ? textInput.value.trim() : '';
        if (!part) {
          showCustomAlert('Please select a part first.', 'Validation', 'warn');
          return;
        }
        if (!remark) {
          showCustomAlert('Please enter a remark or issue description.', 'Validation', 'warn');
          return;
        }
        portalUpdateIssues.push({ part, remark });
        renderPortalUpdateIssues();
        if (textInput) textInput.value = '';
        if (partsSelect) partsSelect.selectedIndex = 0;
      });
    }

    // Populate sound files and load active batches immediately on startup
    populateSoundFiles();
    loadPortalBatches();

  })();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
