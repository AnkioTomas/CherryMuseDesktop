const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const documentState = require('./modules/document-state');
const windowManager = require('./modules/window');
const fileHandler = require('./modules/file-handler');
const imageHandler = require('./modules/image-handler');

// 应用配置
app.name = 'Cherry Muse';
app.setAboutPanelOptions({
  applicationName: 'Cherry Muse',
  applicationVersion: '1.0.0',
  copyright: '© 2025 Ankio. All rights reserved.',
  website: 'https://cherry.ankio.net/',
  authors: ['Ankio']
});

// 单实例锁
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // 第二实例启动时聚焦并打开文件
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    const mainWindow = windowManager.getWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      const filePath = commandLine.find(arg => arg.endsWith('.md') || arg.endsWith('.markdown'));
      if (filePath && fs.existsSync(filePath)) {
        fileHandler.openFileInWindow(path.resolve(workingDirectory, filePath));
      }
    }
  });

  app.whenReady().then(() => {
    imageHandler.setupImageProtocolInterceptor();
    fileHandler.setupFileHandlers();
    imageHandler.setupImageHandler();
    
    windowManager.createWindow(fileHandler.openFileInWindow);
    
    // 处理启动时的命令行参数
    const filePath = process.argv.find(arg => arg.endsWith('.md') || arg.endsWith('.markdown'));
    if (filePath && fs.existsSync(filePath)) {
      documentState.pendingFile = path.resolve(filePath);
    }
  });
}

// macOS: 双击文件打开
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  
  const mainWindow = windowManager.getWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    if (mainWindow.webContents.isLoading()) {
      documentState.pendingFile = filePath;
    } else {
      fileHandler.openFileInWindow(filePath);
    }
  } else {
    documentState.pendingFile = filePath;
    if (app.isReady()) {
      windowManager.createWindow(fileHandler.openFileInWindow);
    }
  }
});

app.on('window-all-closed', () => {
   app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    windowManager.createWindow(fileHandler.openFileInWindow);
  }
});
