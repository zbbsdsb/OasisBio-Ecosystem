import { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } from 'electron'
import path from 'node:path'
import Store from 'electron-store'
import keytar from 'keytar'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

const SERVICE_NAME = 'oasisbio-desktop'
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

let supabaseClient: SupabaseClient | null = null

const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration')
    }
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  }
  return supabaseClient
}

const store = new Store<{
  windowState: {
    width: number
    height: number
    x?: number
    y?: number
    isMaximized?: boolean
  }
}>({
  defaults: {
    windowState: {
      width: 1200,
      height: 800
    }
  }
})

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const getWindowState = () => {
  return store.get('windowState')
}

const saveWindowState = () => {
  if (!mainWindow) return
  const bounds = mainWindow.getBounds()
  store.set('windowState', {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    isMaximized: mainWindow.isMaximized()
  })
}

const createWindow = () => {
  const savedState = getWindowState()

  mainWindow = new BrowserWindow({
    width: savedState.width,
    height: savedState.height,
    x: savedState.x,
    y: savedState.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (savedState.isMaximized) {
    mainWindow.maximize()
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('resize', saveWindowState)
  mainWindow.on('move', saveWindowState)
  mainWindow.on('close', saveWindowState)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const createTray = () => {
  const iconPath = path.join(__dirname, '../assets/icon.png')
  const trayIcon = nativeImage.createFromPath(iconPath)
  const resizedIcon = trayIcon.isEmpty() ? nativeImage.createEmpty() : trayIcon.resize({ width: 16, height: 16 })
  
  tray = new Tray(resizedIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        mainWindow?.show()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('OasisBio Desktop')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    mainWindow?.show()
  })
}

const createMenu = () => {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N'
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: '切换开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            new Notification({
              title: 'OasisBio Desktop',
              body: '版本 0.1.0\n跨时代数字身份系统'
            }).show()
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template as any)
  Menu.setApplicationMenu(menu)
}

const setupIpcHandlers = () => {
  ipcMain.on('app:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('app:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('app:close', () => {
    mainWindow?.close()
  })

  ipcMain.on('app:show-notification', (_, { title, body }) => {
    new Notification({ title, body }).show()
  })

  ipcMain.handle('app:get-window-state', () => {
    if (!mainWindow) return null
    return {
      isMaximized: mainWindow.isMaximized(),
      isMinimized: mainWindow.isMinimized(),
      isFullScreen: mainWindow.isFullScreen()
    }
  })

  ipcMain.handle('app:set-window-state', (_, state) => {
    if (!mainWindow) return
    if (state.isMaximized) {
      mainWindow.maximize()
    } else if (state.isMinimized) {
      mainWindow.minimize()
    } else if (state.isFullScreen) {
      mainWindow.setFullScreen(true)
    }
  })

  ipcMain.handle('auth:send-otp', async (_, email: string) => {
    const client = getSupabaseClient()
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })
    if (error) {
      throw new Error(error.message)
    }
  })

  ipcMain.handle('auth:verify-otp', async (_, email: string, token: string) => {
    const client = getSupabaseClient()
    const { data, error } = await client.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })
    if (error || !data.session) {
      throw new Error(error?.message || 'Invalid OTP')
    }

    const session = transformSession(data.session)
    await keytar.setPassword(SERVICE_NAME, 'session', JSON.stringify(session))
    return session
  })

  ipcMain.handle('auth:get-session', async () => {
    try {
      const sessionData = await keytar.getPassword(SERVICE_NAME, 'session')
      if (!sessionData) return null

      const parsed = JSON.parse(sessionData)
      const session = {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt)
      }

      if (new Date(session.expiresAt) < new Date()) {
        const client = getSupabaseClient()
        if (!session.refreshToken) {
          await keytar.deletePassword(SERVICE_NAME, 'session')
          return null
        }

        const { data, error } = await client.auth.refreshSession({
          refresh_token: session.refreshToken
        })

        if (error || !data.session) {
          await keytar.deletePassword(SERVICE_NAME, 'session')
          return null
        }

        const newSession = transformSession(data.session)
        await keytar.setPassword(SERVICE_NAME, 'session', JSON.stringify(newSession))
        return newSession
      }

      return session
    } catch {
      return null
    }
  })

  ipcMain.handle('auth:sign-out', async () => {
    const client = getSupabaseClient()
    await client.auth.signOut()
    await keytar.deletePassword(SERVICE_NAME, 'session')
  })

  ipcMain.handle('auth:refresh-session', async () => {
    try {
      const sessionData = await keytar.getPassword(SERVICE_NAME, 'session')
      if (!sessionData) return null

      const parsed = JSON.parse(sessionData)
      if (!parsed.refreshToken) {
        await keytar.deletePassword(SERVICE_NAME, 'session')
        return null
      }

      const client = getSupabaseClient()
      const { data, error } = await client.auth.refreshSession({
        refresh_token: parsed.refreshToken
      })

      if (error || !data.session) {
        await keytar.deletePassword(SERVICE_NAME, 'session')
        return null
      }

      const newSession = transformSession(data.session)
      await keytar.setPassword(SERVICE_NAME, 'session', JSON.stringify(newSession))
      return newSession
    } catch {
      await keytar.deletePassword(SERVICE_NAME, 'session')
      return null
    }
  })

  ipcMain.handle('auth:store-session', async (_, sessionJson: string) => {
    await keytar.setPassword(SERVICE_NAME, 'session', sessionJson)
  })

  ipcMain.handle('auth:get-stored-session', async () => {
    return await keytar.getPassword(SERVICE_NAME, 'session')
  })

  ipcMain.handle('auth:clear-stored-session', async () => {
    await keytar.deletePassword(SERVICE_NAME, 'session')
  })

  ipcMain.handle('cache:get', async (_, key: string) => {
    return store.get(`cache_${key}`)
  })

  ipcMain.handle('cache:set', async (_, key: string, value: any) => {
    store.set(`cache_${key}`, value)
  })

  ipcMain.handle('cache:delete', async (_, key: string) => {
    store.delete(`cache_${key}`)
  })

  ipcMain.handle('cache:clear', async () => {
    const keys = Object.keys(store.store)
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        store.delete(key)
      }
    })
  })
}

const transformSession = (supabaseSession: any) => {
  const user = {
    id: supabaseSession.user.id,
    email: supabaseSession.user.email || '',
    emailVerified: supabaseSession.user.email_confirmed_at !== null,
    createdAt: new Date(supabaseSession.user.created_at),
    updatedAt: new Date(supabaseSession.user.updated_at),
    status: 'ACTIVE',
    metadata: supabaseSession.user.user_metadata
  }

  const profile = {
    id: supabaseSession.user.id,
    userId: supabaseSession.user.id,
    displayName: supabaseSession.user.email?.split('@')[0] || 'User',
    avatarUrl: null,
    bio: null,
    createdAt: new Date(supabaseSession.user.created_at),
    updatedAt: new Date(supabaseSession.user.updated_at),
    metadata: {}
  }

  return {
    user,
    profile,
    accessToken: supabaseSession.access_token,
    refreshToken: supabaseSession.refresh_token,
    expiresAt: new Date(Date.now() + (supabaseSession.expires_in || 3600) * 1000)
  }
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  createMenu()
  setupIpcHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  saveWindowState()
})
