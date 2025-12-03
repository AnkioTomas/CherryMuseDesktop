const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
let currentFilePath = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('renderer.html');
}

// 打开文件
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    currentFilePath = result.filePaths[0];
    const content = fs.readFileSync(currentFilePath, 'utf-8');
    return { path: currentFilePath, content };
  }
  return null;
});

// 保存文件
ipcMain.handle('save-file', async (event, content) => {
  if (!currentFilePath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    });
    if (result.canceled) return false;
    currentFilePath = result.filePath;
  }

  fs.writeFileSync(currentFilePath, content, 'utf-8');
  return true;
});

// 另存为
ipcMain.handle('save-file-as', async (event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });
  
  if (result.canceled) return false;
  
  currentFilePath = result.filePath;
  fs.writeFileSync(currentFilePath, content, 'utf-8');
  return true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

