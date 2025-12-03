const { app, BrowserWindow, ipcMain, dialog, Menu, nativeImage, protocol } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 设置应用名称
app.name = 'Cherry Muse';

// 设置关于面板信息（macOS）
app.setAboutPanelOptions({
  applicationName: 'Cherry Muse',
  applicationVersion: '1.0.0',
  copyright: '© 2025 Ankio. All rights reserved.',
  website: 'https://cherry.ankio.net/',
  authors: ['Ankio']
});

let mainWindow;
let currentFilePath = null;
let pendingFileToOpen = null;

// 图片扩展名
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.ico']);

// 拦截图片请求，将相对路径重定向到 MD 文件目录
function setupImageProtocolInterceptor() {
  const rendererDir = __dirname;
  
  // noinspection JSDeprecatedSymbols
  protocol.interceptFileProtocol('file', (request, callback) => {
    let filePath = decodeURIComponent(request.url.replace('file://', ''));
    
    // Windows: /C:/path → C:/path
    if (process.platform === 'win32' && filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    
    const ext = path.extname(filePath).toLowerCase();
    
    // 只拦截图片 + 有打开的文件 + 原路径不存在 + 路径在 renderer 目录下
    if (IMAGE_EXTENSIONS.has(ext) && currentFilePath && !fs.existsSync(filePath) && filePath.startsWith(rendererDir)) {
      const relativePath = path.relative(rendererDir, filePath);
      const redirectedPath = path.join(path.dirname(currentFilePath), relativePath);
      
      if (fs.existsSync(redirectedPath)) {
        return callback({ path: redirectedPath });
      }
    }
    
    callback({ path: filePath });
  });
}

function createMenu() {
  const isMac = process.platform === 'darwin';
  
  const template = [
    // macOS 需要显式创建应用菜单
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: `关于 ${app.name}`, role: 'about' },
        { type: 'separator' },
        { label: '隐藏', accelerator: 'Command+H', role: 'hide' },
        { label: '隐藏其他', accelerator: 'Command+Alt+H', role: 'hideOthers' },
        { label: '全部显示', role: 'unhide' },
        { type: 'separator' },
        { label: '退出', accelerator: 'Command+Q', role: 'quit' }
      ]
    }] : []),
    {
      label: '文件',
      submenu: [
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu-open')
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save')
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('menu-save-as')
        },
        { type: 'separator' },
        // Windows/Linux 的退出放在文件菜单
        ...(!isMac ? [{ 
          label: '退出',
          accelerator: 'Ctrl+Q',
          role: 'quit'
        }] : [])
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '切换编辑模式',
          accelerator: 'CmdOrCtrl+/',
          click: () => mainWindow.webContents.send('menu-toggle-mode')
        },
        { type: 'separator' },
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '切换开发者工具', accelerator: 'Alt+CmdOrCtrl+I', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: isMac ? 'Ctrl+Command+F' : 'F11', role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  // 创建应用图标
  const iconPath = path.join(__dirname, 'icons', 'android-chrome-512x512.png');
  const appIcon = nativeImage.createFromPath(iconPath);
  
  // macOS 下设置 Dock 图标
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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer.html'));
  
  createMenu();

  // 如果有待打开的文件，在窗口加载完成后打开
  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingFileToOpen) {
      openFileInWindow(pendingFileToOpen);
      pendingFileToOpen = null;
    }
  });

  // 窗口关闭时清理引用
  mainWindow.on('closed', () => {
    mainWindow = null;
    currentFilePath = null;
  });
}

// 统一的文件打开函数
function openFileInWindow(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  if (!mainWindow || mainWindow.isDestroyed()) return;
  
  try {
    currentFilePath = filePath;
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    mainWindow.setTitle(`${fileName} - ${app.name}`);
    mainWindow.webContents.send('file-opened', { path: filePath, content, fileName });
  } catch (error) {
    console.error('打开文件失败:', error);
  }
}

// 打开文件
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    currentFilePath = result.filePaths[0];
    const content = fs.readFileSync(currentFilePath, 'utf-8');
    const fileName = path.basename(currentFilePath);
    mainWindow.setTitle(`${fileName} - ${app.name}`);
    return { path: currentFilePath, content, fileName };
  }
  return null;
});

// 保存文件
ipcMain.handle('save-file', async (event, content) => {
  if (!currentFilePath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'Untitled.md',
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    });
    if (result.canceled) return false;
    currentFilePath = result.filePath;
  }

  fs.writeFileSync(currentFilePath, content, 'utf-8');
  const fileName = path.basename(currentFilePath);
  mainWindow.setTitle(`${fileName} - ${app.name}`);
  return true;
});

// 另存为
ipcMain.handle('save-file-as', async (event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: currentFilePath || 'Untitled.md',
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });
  
  if (result.canceled) return false;
  
  currentFilePath = result.filePath;
  fs.writeFileSync(currentFilePath, content, 'utf-8');
  const fileName = path.basename(currentFilePath);
  mainWindow.setTitle(`${fileName} - ${app.name}`);
  return true;
});

// 保存图片
ipcMain.handle('save-image', async (event, imageBuffer, extension) => {
  // 如果当前没有打开的文件，提示用户先保存
  if (!currentFilePath) {
    dialog.showMessageBoxSync(mainWindow, {
      type: 'warning',
      title: '需要先保存文件',
      message: '请先保存当前 Markdown 文件，然后再粘贴图片。',
      buttons: ['确定']
    });
    return null;
  }

  try {
    // 获取文件所在目录
    const fileDir = path.dirname(currentFilePath);
    const assetsDir = path.join(fileDir, 'assets');
    
    // 创建 assets 目录（如果不存在）
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // 生成唯一文件名：时间戳 + 随机字符串
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    const fileName = `image_${timestamp}_${randomStr}.${extension}`;
    const filePath = path.join(assetsDir, fileName);
    
    // 保存图片
    fs.writeFileSync(filePath, imageBuffer);
    
    // 返回相对路径
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

// 确保单实例运行
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // 当第二个实例启动时，聚焦到第一个实例并打开文件
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Windows/Linux: 从命令行参数获取文件路径
      const filePath = commandLine.find(arg => arg.endsWith('.md') || arg.endsWith('.markdown'));
      if (filePath && fs.existsSync(filePath)) {
        openFileInWindow(path.resolve(workingDirectory, filePath));
      }
    }
  });

  app.whenReady().then(() => {
    setupImageProtocolInterceptor();
    createWindow();
    
    // 处理启动时的命令行参数
    const filePath = process.argv.find(arg => arg.endsWith('.md') || arg.endsWith('.markdown'));
    if (filePath && fs.existsSync(filePath)) {
      pendingFileToOpen = path.resolve(filePath);
    }
  });
}

// macOS: 双击文件打开
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.webContents.isLoading()) {
      // 窗口正在加载，稍后打开
      pendingFileToOpen = filePath;
    } else {
      openFileInWindow(filePath);
    }
  } else {
    // 窗口还没创建或已销毁，保存文件路径
    pendingFileToOpen = filePath;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
