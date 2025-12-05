const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (content) => ipcRenderer.invoke('save-file', content),
  saveFileAs: (content) => ipcRenderer.invoke('save-file-as', content),
  saveImage: (imageBuffer, extension) => ipcRenderer.invoke('save-image', imageBuffer, extension),
  setDocumentEdited: (edited) => ipcRenderer.send('set-document-edited', edited),
  onMenuSave: (callback) => ipcRenderer.on('menu-save', callback), // 关闭窗口时的保存
  onFileOpened: (callback) => ipcRenderer.on('file-opened', callback)
});
