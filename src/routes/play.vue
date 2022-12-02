<script async setup lang="ts">
import { ProgressHolder } from "types/progress"

import Axios from "axios"
import path from "node:path"
import { ref, computed, onMounted, Ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ipcRenderer } from "electron"
import { app, net } from "@electron/remote"
import { useJvmSettingsStore } from '../stores/jvmSettings'
import yaml from "yaml"

const os = require("node:os")

async function asyncForEach(array: Array<any>, callback:(v:any, i:number, arr:any[]) => Promise<any>) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}


const jvm = useJvmSettingsStore()
const route = useRoute()
const router = useRouter()

//setup variables for downloading
const progress: ProgressHolder = {
    java: ref({
        name: "java",
        downloaded: false,
        started:false,
        maxSize: 0,
        currentSize: 0,
        downloadSpeed: 0,
        failed: false
    }),
    assets: ref({
        name: "assets",
        downloaded: false,
        started:false,
        maxSize: 0,
        currentSize: 0,
        downloadSpeed: 0,
        failed: false
    }),
    minecraft: ref({
        name: "1.19.2",
        downloaded: false,
        started:false,
        maxSize: 0,
        currentSize: 0,
        downloadSpeed: 0,
        failed:false,
    })
}

const dialog = ref({
    show: false,
    error: "Unknown error!",
    actions: {
        ok: {
            text: "окей че",
            action: () => {
                dialog.value.show = false
                router.push("/")
            }
        },
        continue: {
                text: "пофиг",
                action: () => {
                    dialog.value.show = false
                    startMinecraft()
                }
            }
    }
})

const url = 'http://vandercat.disi.moe/startlight' // CHANGEME
async function apiRequest(endpoint:string, data:any) {
    const response = await Axios.post(url+"api/"+endpoint, data)
    if (!response.data.error) return response.data; else throw response.data.error
}
async function getPackageInfo(packageName: string) {
    return (await apiRequest("package.get", {name:packageName})).package.files as any[];
}
async function getJavaInfo(cfg:any) {
    return (await apiRequest("package.getJava", {java:cfg.minecraft.java, arch:os.arch(), platform:os.platform()})).package.files as any[];
}
async function fetchInfo(info: any[], progress:Ref) {
    console.log('[DOWNLOAD] fetching info...')
    
    info.forEach(element => {
        progress.value.maxSize+=element.size
    });
    console.log(progress.value)
}
async function getProfile() {
    try {
        const profile = await apiRequest("profiles.get", {name: route.params.profile+".yml"})
        ipcRenderer.invoke("writefile", path.resolve(app.getPath("userData"), "profiles", route.params.profile+".yml"), profile)
        return yaml.parse(profile) 
    }
    catch {
        return false
    }
}

async function download(progress:Ref) {
    try {
        const info = await getPackageInfo(progress.value.name)
        await fetchInfo(info, progress)
        console.log('[DOWNLOAD] starting '+progress.value.name+'...')
        progress.value.started = true
        await asyncForEach(info, async element => {
            const pathSep = element.path.split("/")
            const pathToMc = path.resolve(app.getPath("appData"), ".starlightmc", pathSep.slice(1).join(path.sep)) //TODO: Change
            const fileSame = await ipcRenderer.invoke("checkfile", pathToMc, element.sha256)
            if (!fileSame) {
                console.log('[DOWNLOAD] downloading', element.path, "to", pathToMc)
                const starTime = Date.now()
                await ipcRenderer.invoke("download", url+"/"+element.path, pathToMc)
                progress.value.downloadSpeed = element.size/(Date.now()-starTime)
            } else {
                progress.value.downloadSpeed = 0
            }
            progress.value.currentSize+=element.size
        });
    } 
    catch (err){
        console.log(err)
        progress.value.failed = true

    } 
    finally {
    progress.value.downloadSpeed = 0
    progress.value.downloaded = true
    }
}

async function downloadJava(progress:Ref, profile:any) { //TODO: refactor
    try {
        const info = await getJavaInfo(profile)
        await fetchInfo(info, progress)
        console.log('[JAVA] starting '+progress.value.name+'...')
        progress.value.started = true
        await asyncForEach(info, async element => {
            const pathToMc = path.resolve(app.getPath("appData"), ".starlightmc", element.path) //TODO: Change
            const fileSame = await ipcRenderer.invoke("checkfile", pathToMc, element.sha256)
            if (!fileSame) {
                console.log('[JAVA] downloading', element.path, "to", pathToMc)
                const starTime = Date.now()
                try {
                    await ipcRenderer.invoke("download", url+"/"+element.path, pathToMc)
                } catch {
                    console.log("[JAVA] Failed download", element.path)
                }
                progress.value.downloadSpeed = element.size/(Date.now()-starTime)
            } else {
                progress.value.downloadSpeed = 0
            }
            progress.value.currentSize+=element.size
            if (path.basename(element.path, ".exe") == "javaw") {
                ipcRenderer.invoke("writefile", path.resolve(app.getPath("userData"), ".javapath"), pathToMc)
            }
        });
    } 
    catch (err){
        console.log(err)
        progress.value.failed = true

    } 
    finally {
    progress.value.downloadSpeed = 0
    progress.value.downloaded = true
    }
}
function downloadAll(profile:any) {
    const funcs = [download(progress.assets),download(progress.minecraft)]
    if (jvm.bundledJava) {
        funcs.push(downloadJava(progress.java, profile))
    }
    return Promise.all(funcs)
}
async function startMinecraft() {
    router.push("/console")
    await ipcRenderer.invoke("launchMinecraft", route.params.profile)
}

onMounted(async ()=>{
    const status = await getProfile()
    console.log(status)
    await jvm.loadSettings()
    progress.java.value.downloaded = !jvm.bundledJava
    if (status) {
        await downloadAll(status)
        let hasErrors = false
        for (const key in progress) {
            if (Object.prototype.hasOwnProperty.call(progress, key)) {
                const element = progress[key]
                hasErrors = hasErrors || element.value.failed
            }
        }
        if (hasErrors) {
            dialog.value.error = "Произошли ошибки при обновлении клиента игры :/"
            dialog.value.show = true
        } 
        else {
            await startMinecraft()
        }
    } else {
        dialog.value.error = "Нет подключения к серверу :/"
        dialog.value.show = true
    }
})

</script>

<template>
    <div id="mainview" class="padding fullHeight">
        <v-card height="100%" class="mainWrapper">
            <div class="header">cча все будет падажжи</div>
            <div class="main">
                <div class="iconHolder">
                    <v-icon icon="mdi-language-java" size="128"></v-icon>
                    <v-icon icon="mdi-package-variant-closed" size="128"></v-icon>
                    <v-icon icon="mdi-minecraft" size="128"></v-icon>
                </div>
                <div class="infoHolder">
                    <div v-for="item in progress">
                    <v-icon v-if="item.value.failed" icon="mdi-alert-circle-outline" size="32" color="red"/>
                    <v-progress-circular
                        v-else-if="!item.value.downloaded"
                        color="primary"
                        :indeterminate="!item.value.started" 
                        :model-value="item.value.currentSize/item.value.maxSize*100"
                    />
                    <v-icon v-else icon="mdi-check" size="32" color="green"/>
                    </div>
                </div>
            </div>
            <div class="downloadInfo">
                <span>{{Math.floor((progress.java.value.downloadSpeed+progress.assets.value.downloadSpeed+progress.minecraft.value.downloadSpeed)*1000/1024/1024)}}</span>
                <span> МиБ/c</span>
            </div>
            <v-progress-linear 
                :indeterminate="!(progress.java.value.started||progress.assets.value.started||progress.minecraft.value.started)" 
                :model-value="(progress.java.value.currentSize+progress.assets.value.currentSize+progress.minecraft.value.currentSize)/(progress.java.value.maxSize+progress.assets.value.maxSize+progress.minecraft.value.maxSize)*100"
                color="primary"
            />
        </v-card>
        <v-dialog
            v-model="dialog.show"
            persistent
        >
            <v-card>
            <v-card-text>
                {{dialog.error}}
            </v-card-text>
            <v-card-actions>
                <v-btn color="primary" v-for="action in dialog.actions" @click="action.action()">{{action.text}}</v-btn>
            </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>
.padding {
    padding: 16px;
}
.fullHeight {
    height: 100%;
}
.mainWrapper{
    display: flex;
    align-items: stretch;
    flex-direction: column;
    align-items: center;
}
.main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    align-content: center;
    justify-content: center;
}

.iconHolder {
    background-color: #0004;
    padding: 24px;
    display: flex;
    gap: 64px;
    width: fit-content;
    border-radius: 4px;
}
.infoHolder {
    display: flex;
    padding-top: 16px;
    padding-bottom: 16px;
    padding-left: 76px;
    padding-right: 76px;
    width: 560px;
    justify-content: space-between;
}
.header {
    margin-left: 16px;
    margin-top: 16px;
    width: calc(100% - 32px);
    font-weight: 900;
    font-size: 20px;
    font-family: "InterVariable";
    color: white;
}

.downloadInfo {
    position: relative;
    width: 100%;
    right: 16px;
    bottom: 8px;
    text-align: end;
    font-weight: 900;
    font-size: 24px;
    font-family: "InterVariable";
    color: white;
}

</style>

