const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  fetchQuestions: (section) => ipcRenderer.invoke('fetch-questions', section)
});
