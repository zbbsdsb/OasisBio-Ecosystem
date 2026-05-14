import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('app:minimize'),
  maximize: () => ipcRenderer.send('app:maximize'),
  close: () => ipcRenderer.send('app:close'),
  showNotification: (title: string, body: string) => ipcRenderer.send('app:show-notification', { title, body }),
  getWindowState: () => ipcRenderer.invoke('app:get-window-state'),
  setWindowState: (state: any) => ipcRenderer.invoke('app:set-window-state', state),
  auth: {
    sendOtp: (email: string) => ipcRenderer.invoke('auth:send-otp', email),
    verifyOtp: (email: string, token: string) => ipcRenderer.invoke('auth:verify-otp', email, token),
    getSession: () => ipcRenderer.invoke('auth:get-session'),
    signOut: () => ipcRenderer.invoke('auth:sign-out'),
    refreshSession: () => ipcRenderer.invoke('auth:refresh-session')
  },
  cache: {
    get: (key: string) => ipcRenderer.invoke('cache:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('cache:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('cache:delete', key),
    clear: () => ipcRenderer.invoke('cache:clear')
  }
})
