import { app } from 'electron'
import path from 'path'
import fs from 'fs-extra'
import yaml from 'yaml'
import { stringifyExpression } from '@vue/compiler-core'

function check(path:string, type:number) {
    let passed = false
    try {
        fs.accessSync(path, type);
        passed = true
    } 
    finally {
        return passed
    }
}

const cfgfolder = app.getPath("userData")

export function loadConfig(e:Event, name:string) {
    const cfglocation = path.resolve(cfgfolder, name+".yml")

    console.log(`trying to load ${name} cfg at ${cfglocation}`)

    fs.ensureFileSync(cfglocation)
        
    // Check if the file is readable.
    
    const data = fs.readFileSync(cfglocation, 'utf-8')
    return yaml.parse(data)
}
export function saveConfig(e:Event, name:string, data:object) {
    const cfglocation = path.resolve(cfgfolder, name+".yml")

    console.log(`trying to save ${name} cfg at ${cfglocation}`)

    fs.ensureFileSync(cfglocation)
        
    // Check if the file is writable
    if (check(cfglocation, fs.constants.W_OK)) {
        fs.writeFileSync(cfglocation, yaml.stringify(data),'utf-8')
        return true
    }
    return false
}