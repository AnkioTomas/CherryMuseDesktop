// 文档状态 - 三个变量
module.exports = {
  currentFilePath: null,
  isEdited: false,
  pendingFile: null,

  reset() {
    this.currentFilePath = null;
    this.isEdited = false;
    this.pendingFile = null;
  }
};

