const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Read package.json to get version
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = pkg.version;
console.log(`\n==================================================`);
console.log(`Packaging BC Elite QC version ${version}...`);
console.log(`==================================================\n`);

const sourceDir = __dirname;
const outputDir = 'f:\\Company Software\\Builded Setups';
const tempDir = path.join(sourceDir, 'temp_portable');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Clean temporary directory
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// 2. Build fresh Tauri release binary
console.log('--- Step 1: Compiling fresh Tauri Release Binary ---');
try {
  const distSoundDir = path.join(sourceDir, 'dist', 'Sound_checking');
  const srcSoundDir = path.join(sourceDir, 'Sound_checking');
  if (!fs.existsSync(distSoundDir)) {
    fs.mkdirSync(distSoundDir, { recursive: true });
  }
  if (fs.existsSync(srcSoundDir)) {
    fs.cpSync(srcSoundDir, distSoundDir, { recursive: true });
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

// Temporarily overwrite version to "1.5.1" for setup compiling and zip archiving
const releasePkg = { ...pkg, version: '1.5.1' };
fs.writeFileSync('package.json', JSON.stringify(releasePkg, null, 2), 'utf8');

try {
  // 3. Compile the Inno Setup Installer
  console.log('\n--- Step 2: Compiling Inno Setup Installer ---');
  try {
    const isccPath = '"C:\\Users\\Rishad\\AppData\\Local\\Programs\\Inno Setup 6\\ISCC.exe"';
    execSync(`${isccPath} setup.iss`, { stdio: 'inherit' });
    console.log('\nInno Setup Installer compiled successfully.');
  } catch (err) {
    console.error('\nInno Setup compilation failed:', err.message);
    throw err;
  }

  // 3. Replicate the Directory Structure for Portable Version
  console.log('\n--- Step 2: Preparing Portable Version files ---');

  const copyTargets = [
    { src: 'Battery_checking', dest: 'Battery_checking' },
    { src: 'LCD_checking', dest: 'LCD_checking' },
    { src: 'Sound_checking', dest: 'Sound_checking' },
    { src: 'Keyboard_checking', dest: 'Keyboard_checking' },
    { src: 'cpuz', dest: 'cpuz' },
    { src: 'HDSentinel', dest: 'HDSentinel' },
    { src: 'icon.ico', dest: 'icon.ico' }
  ];

  for (const target of copyTargets) {
    const srcPath = path.join(sourceDir, target.src);
    const destPath = path.join(tempDir, target.dest);
    if (fs.existsSync(srcPath)) {
      console.log(`Copying ${target.src}...`);
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      console.warn(`Warning: Source path not found: ${target.src}`);
    }
  }

  // Create Master Checker folder and copy launcher / binaries
  const masterCheckerDest = path.join(tempDir, 'Master Checker');
  fs.mkdirSync(masterCheckerDest, { recursive: true });

  const binTargets = [
    { src: 'src-tauri/target/release/app.exe', dest: 'BizzCoHubQC.exe' },
    { src: 'src-tauri/target/release/WebView2Loader.dll', dest: 'WebView2Loader.dll' },
    { src: 'BizzCoHub QC File.bat', dest: 'BizzCoHub QC File.bat' }
  ];

  for (const target of binTargets) {
    const srcPath = path.join(sourceDir, target.src);
    const destPath = path.join(masterCheckerDest, target.dest);
    if (fs.existsSync(srcPath)) {
      console.log(`Copying binary: ${target.dest}...`);
      fs.copyFileSync(srcPath, destPath);
    } else {
      console.error(`\nError: Critical build binary not found: ${target.src}`);
      console.error('Please verify you have run "npm run build" first to compile the release binary.');
      throw new Error('Critical binary missing.');
    }
  }

  // 4. Zip the Portable Version using PowerShell
  // Use "1.5.1" directly for the archive name
  const zipName = `QC_Software_Portable_v1.5.1.zip`;
  const zipPath = path.join(outputDir, zipName);

  console.log(`\n--- Step 3: Compressing Portable Version into ${zipName} ---`);
  try {
    execSync(`powershell -Command "Set-Location -Path '${tempDir}'; Compress-Archive -Path '*' -DestinationPath '${zipPath}' -Force"`, { stdio: 'inherit' });
    console.log(`\nPortable version packaged successfully: ${zipName}`);
  } catch (err) {
    console.error('\nFailed to create portable zip archive:', err.message);
    throw err;
  }
} catch (err) {
  // Restore package.json version on error and exit
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8');
  process.exit(1);
} finally {
  // 5. Clean up temp folder
  console.log('\nCleaning up temporary files...');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  // Restore package.json version to standard SemVer 1.5.1.0
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8');
}

console.log('\n==================================================');
console.log('Packaging workflow completed successfully!');
console.log(`Outputs located in: ${outputDir}`);
console.log('==================================================\n');
