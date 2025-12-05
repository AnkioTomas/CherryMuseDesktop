const { ipcMain, dialog, protocol } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const documentState = require('./document-state');
const windowManager = require('./window');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.ico']);

function setupImageProtocolInterceptor() {
  const rendererDir = path.join(__dirname, '..');

  // noinspection JSDeprecatedSymbols
  protocol.interceptFileProtocol('file', (request, callback) => {
    let filePath = decodeURIComponent(request.url.replace('file://', ''));
    
    // Windows: /C:/path → C:/path
    if (process.platform === 'win32' && filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const currentFile = documentState.currentFilePath;
    // 只拦截图片 + 有打开的文件 + 原路径不存在 + 路径在 renderer 目录下
    if (IMAGE_EXTENSIONS.has(ext) && currentFile && !fs.existsSync(filePath) && filePath.startsWith(rendererDir)) {
      const relativePath = path.relative(rendererDir, filePath);
      const redirectedPath = path.join(path.dirname(currentFile), relativePath);
      
      if (fs.existsSync(redirectedPath)) {
        return callback({ path: redirectedPath });
      }
    }

    callback({ path: filePath });
  });
}

function setupImageHandler() {
  ipcMain.handle('save-image', async (event, imageBuffer, extension) => {
    const mainWindow = windowManager.getWindow();
    const currentFile = documentState.currentFilePath;
    
    if (!currentFile) {
      dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        title: '需要先保存文件',
        message: '请先保存当前 Markdown 文件，然后再粘贴图片。',
        buttons: ['确定']
      });
      return null;
    }

    try {
      const fileDir = path.dirname(currentFile);
      const assetsDir = path.join(fileDir, 'assets');
      
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      
      const timestamp = Date.now();
      const randomStr = crypto.randomBytes(4).toString('hex');
      const fileName = `image_${timestamp}_${randomStr}.${extension}`;
      const filePath = path.join(assetsDir, fileName);
      
      fs.writeFileSync(filePath, imageBuffer);
      
      return `assets/${fileName}`;
    } catch (error) {
      dialog.showMessageBoxSync(mainWindow, {
        type: 'error',
        title: '保存图片失败',
        message: `保存图片时出错：${error.message}`,
        buttons: ['确定']
      });
      return null;
    }
  });
}

module.exports = {
  setupImageProtocolInterceptor,
  setupImageHandler
};

