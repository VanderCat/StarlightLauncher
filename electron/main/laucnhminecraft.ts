import * as cfg from './config'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import childProcess from 'child_process'
import {v4 as uuid } from 'uuid'
import { ipcMain, app } from 'electron'
import {asyncForEach} from "../utils"

async function loadProfile(e:Event, name:string) {
    const profile = await cfg.loadConfig(e, "profiles/"+name)
    return profile
}
function checkOS(toBeChecked:NodeJS.Platform) {
    return os.platform()==toBeChecked //i think this needs to be expanded
}
function checkArch(toBeChecked:NodeJS.Architecture) {
    return os.arch()==toBeChecked //i think this needs to be expanded
}

function parseArgs(list:any[], args?:string[]) {
    args = args || []
    console.log(list)
    list.forEach(arg => {
        if (typeof arg == "object") {
            let shouldAdd = true
            if (arg.rules) {
                arg.rules.forEach(rule => {
                    const enable = rule.action=='enable'?true:false
                    let checkPassed = true
                    if (rule.conditions.os) { 
                        checkPassed = checkOS(rule.conditions.os) //FIXME: it also can be a regex
                    } 
                    if (rule.conditions.arch) { 
                        checkPassed = checkArch(rule.conditions.arch)
                    }//TODO: expand i guess
                    shouldAdd=shouldAdd&&(enable == checkPassed) //i will not remember how it works
                    //aslo i think it's error prone
                    //need more research
                })
            }
            if (shouldAdd) {
                const type = typeof arg.value 
                if(type == "string") {
                    args.push(arg.value)
                }
                else if (type == "object") {
                    args.concat(arg.value)
                }
            }
        } 
        else {
            args.push(arg)
        }
    })
    return args
}

async function getAllFiles(dirPath: string, arrayOfFiles?: string[]) {
    arrayOfFiles = arrayOfFiles || []
    if (!fs.lstatSync(dirPath).isDirectory()) {
        arrayOfFiles.push(path.resolve(dirPath))
        return
    }
    let files = await fs.readdir(dirPath, {withFileTypes:true})


    await asyncForEach(files, async (file) => {
        if (file.isDirectory()) {
            arrayOfFiles = await getAllFiles(dirPath + path.sep + file.name, arrayOfFiles)
        } else {
            arrayOfFiles?.push(path.join(dirPath, file.name))
        }
    })

    return arrayOfFiles
}
async function prepareClasspath(profile:any, location:string) {
    let files = []
    await asyncForEach(profile.minecraft.classpath, async cpath => {
        await getAllFiles(path.resolve(location,profile.minecraft.name,cpath), files)
    });
    return files.join(path.delimiter)
}

async function prepareJvmArgs(profile:any, jvm:any, location:string) {
    let args = parseArgs(profile.minecraft.arguments.jvm)
    let jvmArgs = jvm.javaArgs.split(" ")
    args.concat(jvmArgs)
    console.log(location,profile.minecraft.name,"natives",os.platform(),os.arch())
    //args.push("-Duser.dir="+path.resolve(location,profile.minecraft.name))
    args.push("-Djava.library.path="+path.resolve(location,profile.minecraft.name,"natives",os.platform(),os.arch()))
    args.push("-Dminecraft.launcher.brand=Starlight")
    args.push("-Dminecraft.launcher.version=0.1")
    args.push("-Dlog4j2.configurationFile="+path.resolve(path.dirname(app.getPath("exe")), "log4jcfg.xml"))
    const cp = await prepareClasspath(profile, location)
    args.push("-cp", cp)
    return args
}

import auth from "./auth";

function prepareClientArgs(profile:any, location:string) {
    const authInfo = auth.loadLastLogin(null)
    let args:string[] = []
    args.push("--username", authInfo.user.name)
    args.push("--accessToken", authInfo.accessToken) 
    args.push("--version", profile.minecraft.version)
    args.push("--gameDir", path.resolve(location, profile.minecraft.name))
    args.push("--assetsDir", path.resolve(location, "assets"))
    //args.push("--assetsDir", "C:/TL/assets")
    args.push("--assetIndex", (profile.minecraft.version as string).split(".").slice(0, 2).join(".")) //FIXME
    args.push("--uuid", authInfo.uuid)
    //args.push("--clientId", "")
    //args.push("--xuid", "")
    args.push("--userType", "legacy")
    args.push("--versionType", "release")
    return args
}

export default async function launchMinecraft(e:Event, sendMessage:Function, Profile:string) {
    const jvm = await cfg.loadConfig(null, "jvm")
    const profile = await loadProfile(e, Profile)
    const location = path.resolve(app.getPath("appData"), ".starlightmc")
    const jvmArgs = await prepareJvmArgs(profile, jvm, location)
    const clientArgs = prepareClientArgs(profile, location)
    const customArgs =  jvm.javaArgs==""?[]:jvm.javaArgs.split(" ")
    console.log("Custom Args", customArgs)
    const finalArgs = [].concat(jvmArgs, customArgs, [profile.minecraft.mainclass], clientArgs)
    console.log("Launching minecraft with parameters", finalArgs)
    let javaPath = ""
    if (jvm.bundledJava)
        javaPath = await fs.readFile(path.resolve(app.getPath("userData"),".javapath"), "utf-8");
    else 
        javaPath = path.resolve(jvm.javaPath, "javaw.exe")
    const proc = childProcess.spawn(javaPath, finalArgs, {
        cwd: path.resolve(location, profile.minecraft.name) //https://github.com/Majrusz/MajruszLibrary/issues/76 :/
    })
    proc.stdout.on('data', (data) => {
        sendMessage(data)
    })
      
    proc.stderr.on('data', (data) => {
        sendMessage(data)
    })
    proc.on('close', (code) => {
        sendMessage('{"minecraftClosed":true}')
    })
}