import path from 'path'
import fs from 'fs-extra'
import yaml from 'yaml'
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { check } from '../utils'

const loginlocation = path.resolve(path.resolve(app.getPath("appData"), ".starlightmc"), ".session.yml")

export function loadLastLogin(e:Event) {
    

    console.log(`trying to load login at ${loginlocation}`)

    fs.ensureFileSync(loginlocation)
        
    // Check if the file is readable.
    
    const data = fs.readFileSync(loginlocation, 'utf-8')
    return yaml.parse(data)??{}
}

export function saveLastLogin(e:Event, data:object) {

    console.log(`trying to save cfg at ${loginlocation}`)

    fs.ensureFileSync(loginlocation)
        
    // Check if the file is writable
    if (check(loginlocation, fs.constants.W_OK)) {
        fs.writeFileSync(loginlocation, yaml.stringify(data),'utf-8')
        return true
    }
    return false
}

export default {
    loadLastLogin,
    saveLastLogin
}