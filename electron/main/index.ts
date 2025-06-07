// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST_ELECTRON, '../public')

import { app, BrowserWindow, shell, ipcMain, AuthInfo } from 'electron'
import { release } from 'os'
import { join } from 'path'
import { fstat } from 'original-fs'
require('@electron/remote/main').initialize()

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

let sendMessage
let sendDeviceCode

function UpsertKeyValue(obj, keyToChange, value) {
  const keyToChangeLower = keyToChange.toLowerCase();
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === keyToChangeLower) {
      // Reassign old key
      obj[key] = value;
      // Done
      return;
    }
  }
  // Insert at end instead
  obj[keyToChange] = value;
}

async function createWindow() {
  win = new BrowserWindow({
    title: 'Starlight Launcher',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    width: 768,
    height: 423,
    autoHideMenuBar: true,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      const { requestHeaders } = details;
      UpsertKeyValue(requestHeaders, 'Access-Control-Allow-Origin', ['*']);
      callback({ requestHeaders });
    },
  );
  
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const { responseHeaders } = details;
    UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*']);
    UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*']);
    callback({
      responseHeaders,
    });
  });

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }
  require("@electron/remote/main").enable(win.webContents)

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })
  sendMessage = (text:string) => win?.webContents.send('minecraft-log', text)
  sendDeviceCode = (res:ServerDeviceCodeResponse) => win?.webContents.send('deviceCode', res)

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// new window example arg: new windows url
ipcMain.handle('open-win', (event, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (app.isPackaged) {
    childWindow.loadFile(indexHtml, { hash: arg })
  } else {
    childWindow.loadURL(`${url}#${arg}`)
    // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
  }
})
import * as cfg from './config'
ipcMain.handle('loadConfig', cfg.loadConfig)
ipcMain.handle('saveConfig', cfg.saveConfig)

import launchMinecraft from './laucnhminecraft'
import { killMinecraft } from './laucnhminecraft'
ipcMain.handle('launchMinecraft', (e, profile)=>launchMinecraft(e, sendMessage, profile))
ipcMain.handle('killMinecraft', (e)=>killMinecraft(e))
import axios from 'axios'
import fs from 'fs-extra'
import crypto from 'crypto'

function iCouldNotCameUpWithBetterIdeaThanThisSoBeIt(data: any) {
  return new Promise<void>((resolve)=>{
    data.on('end', () => resolve())
  })
}

ipcMain.handle('download', async (event, url:string, saveloc:string) => {
  const { data, headers } = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })
  await fs.ensureFile(saveloc)
  const writer = fs.createWriteStream(saveloc)
  await data.pipe(writer)
  await iCouldNotCameUpWithBetterIdeaThanThisSoBeIt(data)
})

ipcMain.handle('checkfile', async (event,location:string, hash:string) => {
  const exist = await fs.pathExists(location)
  if (!exist) return false
  const buffer:Buffer = await fs.readFile(location)
  const sha256 = crypto.createHash('sha256')
  sha256.update(buffer)
  const hex = sha256.digest("hex")
  if (hex!=hash)
    console.log(hex, hash, location)
  return hex==hash
})
ipcMain.handle('writefile', async (event,location:string, data:Buffer|string) => {
  await fs.ensureFile(location)
  await fs.writeFile(location, data)
})
ipcMain.handle('checkpath', async (event,location:string) => {
  const exist = await fs.pathExists(location)
  return exist
})
import {asyncForEach} from "../utils"
import Path from "path"
async function getAllFiles (event, dirPath:string, arrayOfFiles?: string[]) {
  let files = await fs.readdir(dirPath, {withFileTypes:true})

    arrayOfFiles = arrayOfFiles || []

    await asyncForEach(files, async (file) => {
        if (file.isDirectory()) {
            arrayOfFiles = await getAllFiles(event, dirPath + Path.sep + file.name, arrayOfFiles)
        } else {
            arrayOfFiles?.push(Path.join(dirPath, file.name))
        }
    })

    return arrayOfFiles
}
ipcMain.handle('getAllFiles', getAllFiles)
ipcMain.handle('deleteFile', async (event,location:string) => {
  if (await fs.pathExists(location)) {
    await fs.remove(location)
    return true
  }
  return false
})

import auth from "./auth";

ipcMain.handle("loadLastLogin", (e) => {
  return auth.loadLastLogin(e);
})
ipcMain.handle("saveLastLogin", (e, data: any) => {
  return auth.saveLastLogin(e, data);
})

import pAuth, { ServerDeviceCodeResponse } from "prismarine-auth"
import { Console } from 'console'

ipcMain.handle("authMojang", async (e, username: string, password: string) => {
  const flow = new pAuth.Authflow(username, cfg.cfgfolder,{ authTitle: pAuth.Titles.MinecraftNintendoSwitch, deviceType: 'Nintendo', flow: 'live' }, (res)=>{
    console.log(res)
    sendDeviceCode(res);
  })
  const response = await flow.getMinecraftJavaToken({ fetchEntitlements: true, fetchProfile: true, fetchCertificates: true })
  sendDeviceCode();
  return {
    accessToken: response.token,
    uuid: response.profile.id,
    user: {
      name: response.profile.name,
      id: response.profile.id
    },
    clientToken: null,
    mojang: true
  }
})