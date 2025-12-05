// 文档状态管理 - 单一数据源
class DocumentState {
  constructor() {
    this.currentFilePath = null;
    this.isEdited = false;
    this.pendingFileToOpen = null;
  }

  setFilePath(path) {
    this.currentFilePath = path;
  }

  getFilePath() {
    return this.currentFilePath;
  }

  setEdited(edited) {
    this.isEdited = edited;
  }

  isDocumentEdited() {
    return this.isEdited;
  }

  setPendingFile(path) {
    this.pendingFileToOpen = path;
  }

  getPendingFile() {
    const file = this.pendingFileToOpen;
    this.pendingFileToOpen = null;
    return file;
  }

  reset() {
    this.currentFilePath = null;
    this.isEdited = false;
    this.pendingFileToOpen = null;
  }
}

module.exports = new DocumentState();

