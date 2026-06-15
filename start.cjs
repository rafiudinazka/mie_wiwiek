#!/usr/bin/env node

/**
 * 🚀 Kiosk App - One-Click Starter
 * Menjalankan Backend (Express + SQLite) dan Frontend (Svelte + Vite) secara bersamaan
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_PORT = 5173;
const BACKEND_PORT = 3001;

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(prefix, color, message) {
  const timestamp = new Date().toLocaleTimeString('id-ID');
  console.log(`${colors.bright}${color}[${prefix}]${colors.reset} ${colors.cyan}${timestamp}${colors.reset} ${message}`);
}

function printBanner() {
  console.log(`
${colors.bright}${colors.yellow}╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🍜  MIE WIWIEK - Self-Ordering System              ║
║                                                      ║
║   Starting all services...                            ║
║                                                      ║
╚══════════════════════════════════════════════════════╝${colors.reset}
`);
}

function checkNodeModules(dir, name) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log(name, colors.yellow, `node_modules not found! Running npm install...`);
    return new Promise((resolve, reject) => {
      const install = spawn('npm', ['install'], {
        cwd: dir,
        stdio: 'inherit',
        shell: true,
      });
      install.on('close', (code) => {
        if (code === 0) {
          log(name, colors.green, `npm install completed ✅`);
          resolve();
        } else {
          reject(new Error(`npm install failed for ${name} with code ${code}`));
        }
      });
      install.on('error', reject);
    });
  }
  return Promise.resolve();
}

async function startBackend() {
  await checkNodeModules(BACKEND_DIR, 'BACKEND');
  
  log('BACKEND', colors.blue, `Starting Express server on port ${BACKEND_PORT}...`);

  const backend = spawn('node', ['index.js'], {
    cwd: BACKEND_DIR,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env },
  });

  backend.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => log('BACKEND', colors.blue, line));
  });

  backend.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => log('BACKEND', colors.red, line));
  });

  backend.on('error', (err) => {
    log('BACKEND', colors.red, `Failed to start: ${err.message}`);
  });

  backend.on('close', (code) => {
    if (code !== null) {
      log('BACKEND', colors.red, `Process exited with code ${code}`);
    }
  });

  return backend;
}

async function startFrontend() {
  await checkNodeModules(ROOT_DIR, 'FRONTEND');

  log('FRONTEND', colors.magenta, `Starting Vite dev server on port ${FRONTEND_PORT}...`);

  const frontend = spawn('npx', ['vite', '--port', String(FRONTEND_PORT), '--host'], {
    cwd: ROOT_DIR,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env },
  });

  frontend.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => log('FRONTEND', colors.magenta, line));
  });

  frontend.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => log('FRONTEND', colors.red, line));
  });

  frontend.on('error', (err) => {
    log('FRONTEND', colors.red, `Failed to start: ${err.message}`);
  });

  frontend.on('close', (code) => {
    if (code !== null) {
      log('FRONTEND', colors.red, `Process exited with code ${code}`);
    }
  });

  return frontend;
}

function printReadyMessage() {
  setTimeout(() => {
    console.log(`
${colors.bright}${colors.green}╔══════════════════════════════════════════════════════╗
║                                                      ║
║   ✅  ALL SERVICES RUNNING!                          ║
║                                                      ║
║   🖥️  Kiosk (Customer):  http://localhost:${FRONTEND_PORT}       ║
║   💰  Cashier:           http://localhost:${FRONTEND_PORT}/#cashier ║
║   ⚙️   Admin:             http://localhost:${FRONTEND_PORT}/#admin   ║
║   🔌  API Backend:       http://localhost:${BACKEND_PORT}        ║
║                                                      ║
║   Admin PIN: 1234                                    ║
║                                                      ║
║   Press Ctrl+C to stop all services                  ║
║                                                      ║
╚══════════════════════════════════════════════════════╝${colors.reset}
`);
  }, 3000);
}

async function main() {
  printBanner();

  let backendProcess, frontendProcess;

  try {
    backendProcess = await startBackend();
    frontendProcess = await startFrontend();
    printReadyMessage();
  } catch (err) {
    console.error(`\n${colors.red}${colors.bright}❌ Failed to start services: ${err.message}${colors.reset}\n`);
    process.exit(1);
  }

  // Graceful shutdown
  function shutdown() {
    console.log(`\n${colors.yellow}${colors.bright}🛑 Shutting down all services...${colors.reset}`);
    
    if (backendProcess && !backendProcess.killed) {
      backendProcess.kill('SIGTERM');
      log('BACKEND', colors.yellow, 'Stopped');
    }
    if (frontendProcess && !frontendProcess.killed) {
      frontendProcess.kill('SIGTERM');
      log('FRONTEND', colors.yellow, 'Stopped');
    }

    setTimeout(() => {
      console.log(`${colors.green}${colors.bright}👋 Goodbye!${colors.reset}\n`);
      process.exit(0);
    }, 1000);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
