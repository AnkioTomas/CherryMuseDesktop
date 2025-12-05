const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (content) => ipcRenderer.invoke('save-file', content),
  saveFileAs: (content) => ipcRenderer.invoke('save-file-as', content),
  saveImage: (imageBuffer, extension) => ipcRenderer.invoke('save-image', imageBuffer, extension),
  setDocumentEdited: (edited) => ipcRenderer.send('set-document-edited', edited),
  setFilePath: (file) => ipcRenderer.send('set-file-path', webUtils.getPathForFile(file)),
  onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', callback)
});
