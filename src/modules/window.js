const { app, BrowserWindow, nativeImage, dialog, Menu } = require('electron');
const path = require('path');
const documentState = require('./document-state');

let mainWindow = null;

function getWindow() {
  return mainWindow;
}

function isWindowValid() {
  return mainWindow && !mainWindow.isDestroyed();
}

function updateTitle() {
  if (!isWindowValid()) return;
  
  const filePath = documentState.currentFilePath;
  const fileName = filePath ? path.basename(filePath) : '未命名';
  
  // 所有平台：未保存时在文件名前加星号
  const prefix = documentState.isEdited ? '* ' : '';
  mainWindow.setTitle(`${prefix}${fileName} - ${app.name}`);
  
  // macOS 额外：在关闭按钮上显示圆点
  if (process.platform === 'darwin') {
    mainWindow.setDocumentEdited(documentState.isEdited);
  }
}

function createWindow(onFileOpened) {
  // 禁用默认菜单，使用快捷键代替
  Menu.setApplicationMenu(null);
  
  const iconPath = path.join(__dirname, '../icons', 'android-chrome-512x512.png');
  const appIcon = nativeImage.createFromPath(iconPath);
  
  if (process.platform === 'darwin') {
    app.dock.setIcon(appIcon);
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: appIcon,
    title: app.name,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer.html'));

  // 开启开发者工具
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
    const pending = documentState.pendingFile;
    if (pending && onFileOpened) {
      onFileOpened(pending);
      documentState.pendingFile = null;
    }
  });

  mainWindow.on('close', (event) => {
    if (!documentState.isEdited) return;
    
    event.preventDefault();
    
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['保存', '不保存', '取消'],
      defaultId: 0,
      cancelId: 2,
      title: '未保存的更改',
      message: '当前文档有未保存的更改，是否保存？'
    });
    
    if (choice === 0) {
      mainWindow.webContents.send('menu-save');
    } else if (choice === 1) {
      documentState.isEdited = false;
      mainWindow.close();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    documentState.reset();
  });

  return mainWindow;
}

function sendToRenderer(channel, data) {
  if (isWindowValid()) {
    mainWindow.webContents.send(channel, data);
  }
}

module.exports = {
  createWindow,
  getWindow,
  isWindowValid,
  updateTitle,
  sendToRenderer
};

