const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const https = require('https');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

autoUpdater.on('update-available', () => {
  log.info('Update available.');
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded.');
  autoUpdater.quitAndInstall();
});


let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'logo.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // If running with --dev, load the Vite dev server URL
  if (process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ipcMain.handle('fetch-questions', (event, section) => {
    return new Promise((resolve, reject) => {
      https.get(`https://pinesat.com/api/questions?section=${section}`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e.message);
          }
        });
      }).on('error', (e) => {
        reject(e.message);
      });
    });
  });

  // Inject permissive CSP so Desmos fonts/styles/scripts can load.
  // IMPORTANT: Electron stores response header keys in lowercase — we must
  // case-insensitively delete any existing CSP before writing ours, otherwise
  // both headers survive and the browser enforces the intersection (stricter one).
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = Object.assign({}, details.responseHeaders);

    // Delete any existing CSP header regardless of letter case
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === 'content-security-policy') {
        delete headers[key];
      }
    }

    headers['Content-Security-Policy'] = [
      "default-src 'self' file: http://localhost:* https://www.desmos.com; " +
      "connect-src 'self' file: https://pinesat.com ws://localhost:* http://localhost:* https://www.desmos.com; " +
      "script-src 'self' file: 'unsafe-inline' 'unsafe-eval' https://www.desmos.com http://localhost:*; " +
      "style-src 'self' file: 'unsafe-inline' https://www.desmos.com; " +
      "font-src 'self' file: https://www.desmos.com data:; " +
      "img-src 'self' file: data: blob: https://www.desmos.com; " +
      "worker-src 'self' file: blob:;"
    ];

    callback({ responseHeaders: headers });
  });

  createWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
