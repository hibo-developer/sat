const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('satDesktop', {
  platform: 'desktop',
});
