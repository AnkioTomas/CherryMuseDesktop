const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const documentState = require('./document-state');
const windowManager = require('./window');

function openFileInWindow(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  if (!windowManager.isWindowValid()) return;
  
  try {
    documentState.currentFilePath = filePath;
    documentState.isEdited = false;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    windowManager.updateTitle();
    windowManager.sendToRenderer('file-opened', { path: filePath, content, fileName });
  } catch (error) {
    console.error('打开文件失败:', error);
  }
}

function setupFileHandlers() {
  ipcMain.handle('open-file', async () => {
    const mainWindow = windowManager.getWindow();
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      documentState.currentFilePath = result.filePaths[0];
      documentState.isEdited = false;
      
      const content = fs.readFileSync(documentState.currentFilePath, 'utf-8');
      const fileName = path.basename(documentState.currentFilePath);
      
      windowManager.updateTitle();
      return { path: documentState.currentFilePath, content, fileName };
    }
    return null;
  });

  ipcMain.handle('save-file', async (event, content) => {
    const mainWindow = windowManager.getWindow();
    
    if (!documentState.currentFilePath) {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'Untitled.md',
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      });
      if (result.canceled) return false;
      documentState.currentFilePath = result.filePath;
    }

    fs.writeFileSync(documentState.currentFilePath, content, 'utf-8');
    documentState.isEdited = false;
    windowManager.updateTitle();
    return true;
  });

  ipcMain.handle('save-file-as', async (event, content) => {
    const mainWindow = windowManager.getWindow();
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: documentState.currentFilePath || 'Untitled.md',
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    });
    
    if (result.canceled) return false;
    
    documentState.currentFilePath = result.filePath;
    fs.writeFileSync(documentState.currentFilePath, content, 'utf-8');
    documentState.isEdited = false;
    windowManager.updateTitle();
    return true;
  });

  ipcMain.on('set-document-edited', (event, edited) => {
    documentState.isEdited = edited;
    windowManager.updateTitle();
  });

  ipcMain.on('set-file-path', (event, filePath) => {
    documentState.currentFilePath = filePath;
    documentState.isEdited = false;
    windowManager.updateTitle();
  });
}

module.exports = {
  setupFileHandlers,
  openFileInWindow
};

