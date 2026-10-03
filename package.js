const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Read package.json to get version
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = pkg.version;
console.log(`\n==================================================`);
console.log(`Packaging BC Elite QC - Split Editions v${version}...`);
console.log(`==================================================\n`);

const sourceDir = __dirname;
let outputDir = 'e:\\Company Software\\Builded Setups';
try {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
} catch (e) {
  outputDir = path.join(sourceDir, 'dist_setups');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  console.log(`Note: Using fallback output directory: ${outputDir}`);
}

const tempDirCustomer = path.join(sourceDir, 'temp_portable_customer');
const tempDirAdmin = path.join(sourceDir, 'temp_portable_admin');

// Clean temporary directories
[tempDirCustomer, tempDirAdmin].forEach(dir => {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
    }
  } catch (e) {
    console.warn(`Warning: Could not remove directory ${dir} immediately, proceeding.`);
  }
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {}
});

// Helper to find ISCC compiler
function findISCC() {
  const candidatePaths = [
    'iscc',
    'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe',
    'C:\\Program Files\\Inno Setup 6\\ISCC.exe',
    'C:\\Users\\' + (process.env.USERNAME || 'Rishad') + '\\AppData\\Local\\Programs\\Inno Setup 6\\ISCC.exe',
    'C:\\Users\\' + (process.env.USERNAME || 'Z Book Fury G8') + '\\AppData\\Local\\Programs\\Antigravity IDE\\resources\\app\\node_modules\\innosetup\\bin\\ISCC.exe',
    'C:\\Users\\Z Book Fury G8\\AppData\\Local\\Programs\\Antigravity IDE\\resources\\app\\node_modules\\innosetup\\bin\\ISCC.exe',
    'C:\\Users\\Rishad\\AppData\\Local\\Programs\\Inno Setup 6\\ISCC.exe',
    'C:\\Users\\Z Book Fury G8\\AppData\\Local\\Programs\\Inno Setup 6\\ISCC.exe'
  ];

  for (const p of candidatePaths) {
    if (p === 'iscc') {
      try {
        execSync('iscc /?', { stdio: 'ignore' });
        return 'iscc';
      } catch (e) { }
    } else if (fs.existsSync(p)) {
      return `"${p}"`;
    }
  }
  return null;
}

// 2. Build fresh Tauri release binary
console.log('--- Step 1: Compiling fresh Tauri Release Binary ---');
try {
  const distSoundDir = path.join(sourceDir, 'dist', 'Sound_checking');
  if (fs.existsSync(distSoundDir)) {
    fs.rmSync(distSoundDir, { recursive: true, force: true });
  }

  execSync('npm run build', {
    stdio: 'inherit',
    cwd: sourceDir,
    shell: true
  });
  console.log('\nTauri release binary compiled successfully.');
} catch (err) {
  console.error('\nTauri compilation failed:', err.message);
  process.exit(1);
}

// Temporarily ensure version is formatted for setup compiling
const releasePkg = { ...pkg, version };
fs.writeFileSync('package.json', JSON.stringify(releasePkg, null, 2), 'utf8');

try {
  // 3. Compile Inno Setup Installers
  console.log('\n--- Step 2: Compiling Inno Setup Installers ---');
  const isccPath = findISCC();

  if (isccPath) {
    // A. Customer Full Setup Installer
    console.log('\n-> Compiling Customer Edition Setup Installer (setup_customer.iss)...');
    try {
      execSync(`${isccPath} setup_customer.iss`, { stdio: 'inherit' });
      console.log('Customer Edition Installer compiled successfully.');
    } catch (err) {
      console.error('Customer Edition Inno Setup compilation failed:', err.message);
    }

    // B. Admin Full Setup Installer
    console.log('\n-> Compiling Admin & Staff Edition Setup Installer (setup_admin.iss)...');
    try {
      execSync(`${isccPath} setup_admin.iss`, { stdio: 'inherit' });
      console.log('Admin Edition Installer compiled successfully.');
    } catch (err) {
      console.error('Admin Edition Inno Setup compilation failed:', err.message);
    }
  } else {
    console.warn('Warning: ISCC (Inno Setup Compiler) was not located. Skipping installer .exe creation.');
  }

  // 4. Prepare Portable Packages (Customer & Admin)
  console.log('\n--- Step 3: Preparing Portable Versions ---');

  const copyTargets = [
    { src: 'Battery_checking', dest: 'Battery_checking' },
    { src: 'LCD_checking', dest: 'LCD_checking' },
    { src: 'Sound_checking', dest: 'Sound_checking' },
    { src: 'Keyboard_checking', dest: 'Keyboard_checking' },
    { src: 'cpuz', dest: 'cpuz' },
    { src: 'HDSentinel', dest: 'HDSentinel' },
    { src: 'icon.ico', dest: 'icon.ico' },
    { src: 'Sound Checking.ico', dest: 'Sound Checking.ico' }
  ];

  const binTargets = [
    { src: 'src-tauri/target/release/app.exe', dest: 'BizzCoHubQC.exe' },
    { src: 'src-tauri/target/release/WebView2Loader.dll', dest: 'WebView2Loader.dll' },
    { src: 'BizzCoHub QC File.bat', dest: 'BizzCoHub QC File.bat' }
  ];

  function populatePortableDir(targetDir, modeConfig) {
    for (const target of copyTargets) {
      const srcPath = path.join(sourceDir, target.src);
      const destPath = path.join(targetDir, target.dest);
      if (fs.existsSync(srcPath)) {
        fs.cpSync(srcPath, destPath, { recursive: true });
      }
    }

    const masterCheckerDest = path.join(targetDir, 'Master Checker');
    fs.mkdirSync(masterCheckerDest, { recursive: true });

    // Copy binaries to BOTH root directory and Master Checker directory
    for (const target of binTargets) {
      const srcPath = path.join(sourceDir, target.src);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(masterCheckerDest, target.dest));
        fs.copyFileSync(srcPath, path.join(targetDir, target.dest));
      }
    }

    // Write mode configuration to both root and Master Checker
    fs.writeFileSync(path.join(targetDir, 'app_mode.json'), JSON.stringify(modeConfig, null, 2), 'utf8');
    fs.writeFileSync(path.join(masterCheckerDest, 'app_mode.json'), JSON.stringify(modeConfig, null, 2), 'utf8');
  }

  // Customer Portable
  console.log('Populating Customer Portable directory...');
  populatePortableDir(tempDirCustomer, { mode: 'customer', edition: 'Customer Edition' });
  const customerZipName = `QC_Software_Portable_Customer_v${version}.zip`;
  const customerZipPath = path.join(outputDir, customerZipName);
  console.log(`Compressing ${customerZipName}...`);
  execSync(`tar -a -c -f "${customerZipPath}" -C "${tempDirCustomer}" *`, { stdio: 'inherit' });
  console.log(`Created: ${customerZipPath}`);

  // Admin Portable
  console.log('Populating Admin Portable directory...');
  populatePortableDir(tempDirAdmin, { mode: 'admin', edition: 'Admin & Staff Edition' });
  const adminZipName = `QC_Software_Portable_Admin_v${version}.zip`;
  const adminZipPath = path.join(outputDir, adminZipName);
  console.log(`Compressing ${adminZipName}...`);
  execSync(`tar -a -c -f "${adminZipPath}" -C "${tempDirAdmin}" *`, { stdio: 'inherit' });
  console.log(`Created: ${adminZipPath}`);

} catch (err) {
  console.error('\nPackaging error:', err);
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8');
  process.exit(1);
} finally {
  console.log('\nCleaning up temporary directories...');
  [tempDirCustomer, tempDirAdmin].forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
      }
    } catch (e) {}
  });
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8');
}

console.log('\n==================================================');
console.log('Dual-Edition Packaging workflow completed successfully!');
console.log(`Outputs located in: ${outputDir}`);
console.log('==================================================\n');
