const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (content) => ipcRenderer.invoke('save-file', content),
  saveFileAs: (content) => ipcRenderer.invoke('save-file-as', content),
  saveImage: (imageBuffer, extension) => ipcRenderer.invoke('save-image', imageBuffer, extension),
  onMenuOpen: (callback) => ipcRenderer.on('menu-open', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
  onMenuSaveAs: (callback) => ipcRenderer.on('menu-save-as', callback),
  onMenuToggleMode: (callback) => ipcRenderer.on('menu-toggle-mode', callback),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', callback)
});
