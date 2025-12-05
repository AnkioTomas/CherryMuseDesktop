const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const documentState = require('./document-state');
const windowManager = require('./window');

function openFileInWindow(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  if (!windowManager.isWindowValid()) return;
  
  try {
    documentState.setFilePath(filePath);
    documentState.setEdited(false);
    
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
      documentState.setFilePath(result.filePaths[0]);
      documentState.setEdited(false);
      
      const content = fs.readFileSync(documentState.getFilePath(), 'utf-8');
      const fileName = path.basename(documentState.getFilePath());
      
      windowManager.updateTitle();
      return { path: documentState.getFilePath(), content, fileName };
    }
    return null;
  });

  ipcMain.handle('save-file', async (event, content) => {
    const mainWindow = windowManager.getWindow();
    
    if (!documentState.getFilePath()) {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'Untitled.md',
        filters: [{ name: 'Markdown', extensions: ['md'] }]
      });
      if (result.canceled) return false;
      documentState.setFilePath(result.filePath);
    }

    fs.writeFileSync(documentState.getFilePath(), content, 'utf-8');
    documentState.setEdited(false);
    windowManager.updateTitle();
    return true;
  });

  ipcMain.handle('save-file-as', async (event, content) => {
    const mainWindow = windowManager.getWindow();
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: documentState.getFilePath() || 'Untitled.md',
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    });
    
    if (result.canceled) return false;
    
    documentState.setFilePath(result.filePath);
    fs.writeFileSync(documentState.getFilePath(), content, 'utf-8');
    documentState.setEdited(false);
    windowManager.updateTitle();
    return true;
  });

  ipcMain.on('set-document-edited', (event, edited) => {
    documentState.setEdited(edited);
    windowManager.updateTitle();
  });
}

module.exports = {
  setupFileHandlers,
  openFileInWindow
};

