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
  
  const fileName = documentState.getFilePath() 
    ? path.basename(documentState.getFilePath()) 
    : '未命名';
  mainWindow.setTitle(`${fileName} - ${app.name}`);
  
  if (process.platform === 'darwin') {
    mainWindow.setDocumentEdited(documentState.isDocumentEdited());
  }
}

function createWindow(onFileOpened) {
  // 禁用默认菜单，使用 Cherry Markdown 自定义菜单
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

  mainWindow.webContents.on('did-finish-load', () => {
    const pending = documentState.getPendingFile();
    if (pending && onFileOpened) {
      onFileOpened(pending);
    }
  });

  mainWindow.on('close', (event) => {
    if (!documentState.isDocumentEdited()) return;
    
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
      documentState.setEdited(false);
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

