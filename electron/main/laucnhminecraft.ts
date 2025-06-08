import * as cfg from './config'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import childProcess, { ChildProcessWithoutNullStreams } from 'child_process'
import {v4 as uuid } from 'uuid'
import { ipcMain, app } from 'electron'
import {asyncForEach} from "../utils"
import * as mod from "./modcontrol"
import {Profile} from "../../types/profile"
import urls from "../urllist"

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
async function prepareClasspath(profile: Profile, location:string) {
    let files = []
    await asyncForEach(profile.minecraft.classpath, async cpath => {
        await getAllFiles(path.resolve(location,profile.minecraft.name,cpath), files)
    });
    return files.join(path.delimiter)
}

async function prepareJvmArgs(profile: Profile, jvm:any, location:string, profileName:string) {
    let args = parseArgs(profile.minecraft.arguments.jvm)
    let jvmArgs = jvm.javaArgs.split(" ")
    args.concat(jvmArgs)
    console.log(location,profile.minecraft.name,"natives",os.platform(),os.arch())
    //args.push("-Duser.dir="+path.resolve(location,profile.minecraft.name))
    args.push("-Xms"+Math.floor(jvm.ram/2)+"M")
    args.push("-Xmx"+jvm.ram+"M")
    args.push("-Djava.library.path="+path.resolve(location,profile.minecraft.name,"natives",os.platform(),os.arch()))
    args.push("-Dminecraft.launcher.brand=Starlight")
    args.push("-Dminecraft.launcher.version="+app.getVersion())
    args.push("-Dlog4j2.configurationFile="+path.resolve(location, "log4jcfg.xml"))
    if (profile.minecraft.mods != null)
        if (mod.prepareModList(profile, profileName))
            args.push("-Dfabric.addMods=@"+path.resolve(location, ".modlist"))
    const login = loadLastLogin(null)
    if (!login.mojang)
        if (urls.auth.env == "custom") {
            args.push("-Dminecraft.api.env=custom")
            args.push("-Dminecraft.api.auth.host="+urls.auth.authHost)
            args.push("-Dminecraft.api.account.host="+urls.auth.accountHost)
            args.push("-Dminecraft.api.session.host="+urls.auth.sessionHost)
            args.push("-Dminecraft.api.services.host="+urls.auth.servicesHost)
        }
    const cp = await prepareClasspath(profile, location)
    args.push("-cp", cp)
    return args
}

import auth, { loadLastLogin } from "./auth";

function prepareClientArgs(profile: Profile, location:string) {
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

export let proc: ChildProcessWithoutNullStreams

export async function killMinecraft(e:Event) {
    if (!proc) return;
    proc.kill('SIGKILL')
}

export default async function launchMinecraft(e:Event, sendMessage:Function, profileName: string) {
    if (proc) return;
    const jvm = await cfg.loadConfig(null, "jvm")
    const profile: Profile = await loadProfile(e, profileName)
    const location = cfg.cfgfolder
    if (!(await fs.pathExists(path.resolve(location, "log4jcfg.xml"))))
    { //FIXME: i should not embed the file in script
        fs.writeFileSync(path.resolve(location, "log4jcfg.xml"), `<?xml version="1.0" encoding="UTF-8"?>
        <Configuration status="WARN">
            <Appenders>
                <Console name="SysOut" target="SYSTEM_OUT">
                    <!--<JsonTemplateLayout compact="true" eventEol="true" properties="true" stacktraceAsString="true" includeTimeMillis="true" />-->
                    <PatternLayout 
                      pattern='{"timeMillis":%d{UNIX_MILLIS}, "level":"%level", "message":"%enc{%msg{ansi}\n%rEx}{json}", "thread":"%t"}%n' disableAnsi="false"/>
                </Console>
                <RollingRandomAccessFile name="File" fileName="logs/latest.log" filePattern="logs/%d{yyyy-MM-dd}-%i.log.gz">
                    <PatternLayout pattern="[%d{HH:mm:ss}] [%t/%level]: %msg{nolookups}%n" />
                    <Policies>
                        <TimeBasedTriggeringPolicy />
                        <OnStartupTriggeringPolicy />
                    </Policies>
                </RollingRandomAccessFile>
            </Appenders>
            <Loggers>
                <Root level="info">
                    <filters>
                        <MarkerFilter marker="NETWORK_PACKETS" onMatch="DENY" onMismatch="NEUTRAL" />
                    </filters>
                    <AppenderRef ref="SysOut"/>
                    <AppenderRef ref="File"/>
                </Root>
            </Loggers>
        </Configuration>`) 
    }
    console.log(profile)
    const jvmArgs = await prepareJvmArgs(profile, jvm, location, profileName)
    const clientArgs = prepareClientArgs(profile, location)
    const customArgs =  jvm.javaArgs==""?[]:jvm.javaArgs.split(" ")
    console.log("Custom Args", customArgs)
    const finalArgs = [].concat(jvmArgs, customArgs, [profile.minecraft.mainclass], clientArgs)
    console.log("Launching minecraft with parameters", finalArgs)
    let javaPath = ""
    if (jvm.bundledJava)
        javaPath = await fs.readFile(path.resolve(cfg.cfgfolder,".javapath"), "utf-8");
    else {
        if (process.platform =="win32")
            javaPath = path.resolve(jvm.javaPath, "javaw.exe")
        else 
        javaPath = path.resolve(jvm.javaPath, "java")
    }
    let cwd = path.resolve(location, profile.minecraft.name);
    //console.log(cwd, javaPath, finalArgs)
    proc = childProcess.spawn(javaPath, finalArgs, {
        cwd: cwd //https://github.com/Majrusz/MajruszLibrary/issues/76 :/
    })
    proc.stdout.setEncoding('utf-8')
    proc.stdout.on('data', (data) => {
        //console.log(data)
        sendMessage(data)
    })
    proc.stderr.setEncoding('utf-8')
    proc.stderr.on('data', (data) => {
        sendMessage(data)
    })
    proc.on('close', (code) => {
        proc = null
        sendMessage('{"minecraftClosed":true}')
    })
}