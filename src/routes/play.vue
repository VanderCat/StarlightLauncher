<script async setup lang="ts">
import { ProgressHolder } from "types/progress"

import path from "node:path"
import { ref, onMounted, Ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ipcRenderer } from "electron"
import { app } from "@electron/remote"
import { useJvmSettingsStore } from '../stores/jvmSettings'

import { getJavaInfo, getPackageInfo, getProfile} from "../serverapi"
import { asyncForEach, asyncForEachParallel } from "../utils"
import{ useI18n } from "vue-i18n";
import urllist from "../../electron/urllist"

const { t } = useI18n()

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
            text: t("loading.error.cancel"),
            action: () => {
                dialog.value.show = false
                router.push("/")
            }
        },
        continue: {
                text: t("loading.error.launch"),
                action: () => {
                    dialog.value.show = false
                    startMinecraft()
                }
            }
    }
})

async function fetchInfo(info: any[], progress:Ref) {
    console.log('[DOWNLOAD] fetching info...')
    
    info.forEach(element => {
        progress.value.maxSize+=element.size
    });
    console.log(progress.value)
}
const pathToMc = path.resolve(app.getPath("appData"), ".starlightmc")
async function download(progress:Ref, skipList?:string[]) {
    console.log("using skiplist ",skipList)
    try {
        const info = await getPackageInfo(progress.value.name)
        await fetchInfo(info, progress)
        console.log('[DOWNLOAD] starting '+progress.value.name+'...')
        progress.value.started = true
        await asyncForEach(info, async element => {
            const pathSep = element.path.split("/")
            const serverPath = pathSep.slice(2).join("/")
            const betterPath = pathSep.slice(1).join(path.sep)
            const pathToFile = path.resolve(pathToMc, betterPath) //TODO: Change
            const fileSame = await ipcRenderer.invoke("checkfile", pathToFile, element.sha256)
            let skip = false
            if (skipList)
                skipList.forEach((entry: string) => {
                    skip = skip || serverPath.startsWith(entry)
                })
            if (!skip || !await ipcRenderer.invoke("checkpath", pathToFile))
                if (!(fileSame ) ) {
                    console.log('[DOWNLOAD] downloading', element.path, "to", pathToFile)
                    const starTime = Date.now()
                    await ipcRenderer.invoke("download", urllist.launcherHost+"/"+element.path, pathToFile)
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
            const pathToFile = path.resolve(pathToMc, element.path) //TODO: Change
            const fileSame = await ipcRenderer.invoke("checkfile", pathToFile, element.sha256)
            if (!fileSame) {
                console.log('[JAVA] downloading', element.path, "to", pathToFile)
                const starTime = Date.now()
                try {
                    await ipcRenderer.invoke("download", urllist.launcherHost+"/"+element.path, pathToFile)
                } catch {
                    console.log("[JAVA] Failed download", element.path)
                }
                progress.value.downloadSpeed = element.size/(Date.now()-starTime)
            } else {
                progress.value.downloadSpeed = 0
            }
            progress.value.currentSize+=element.size
            if (path.basename(element.path, "w.exe") == "java") {
                ipcRenderer.invoke("writefile", path.resolve(path.resolve(app.getPath("appData"), ".starlightmc"), ".javapath"), pathToFile)
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
function downloadAll(profile:any, skipFileList: string[]) {
    const funcs = [download(progress.assets),download(progress.minecraft, profile.minecraft.skipCheck)]
    if (jvm.bundledJava) {
        funcs.push(downloadJava(progress.java, profile))
    }
    return Promise.all(funcs)
}
async function startMinecraft() {
    router.push("/console")
    await ipcRenderer.invoke("launchMinecraft", route.params.profile)
}

async function generateSkipFileList(profile:any) {
    const list:string[] = []
    await asyncForEach(profile.minecraft.skipCheck, async (entry:string) => {
        entry = entry.replaceAll("/", path.sep)
        if ((await ipcRenderer.invoke("checkpath", entry)))
            list.push(entry)
    })
    return list
}

async function PurgeFiles(profile:any, pack:any) {
    console.log("purge started")
    await asyncForEachParallel(profile.minecraft.forceCheck, async (entry:string) => {
        const currentFileList: string[] = await ipcRenderer.invoke("getAllFiles", path.resolve( pathToMc, profile.minecraft.name, entry))
        await asyncForEachParallel(currentFileList, async (file:string) => {
            const serverFilename = "updates"+file.replace(pathToMc, "").replaceAll("\\","/");
            //console.log("checking ", serverFilename)
            let legalFile = false;
            await asyncForEachParallel(pack, async (serverFile:any) => {
                //console.log("debug ", serverFile)
                if (serverFile.path==serverFilename) {
                    const legality = await ipcRenderer.invoke("checkfile", file, serverFile.sha256);
                    console.log(serverFilename, "is not legal")
                    legalFile = legalFile || legality
                }
            })
            if (!legalFile) {
                //console.log("deliting ", file)
                if (await ipcRenderer.invoke("deleteFile", file)) {
                    console.log("removed illegal file "+file)
                }
            }
        })
    })
    //return list
}

onMounted(async ()=>{
    const profile = await getProfile(route.params.profile as string)
    console.log(profile)
    await jvm.loadSettings()
    progress.java.value.downloaded = !jvm.bundledJava
    if (profile) {
        progress.minecraft.value.name = profile.minecraft.name
        progress.assets.value.name = profile.minecraft.assets
        await downloadAll(profile, await generateSkipFileList(profile))
        await PurgeFiles(profile, await getPackageInfo(progress.minecraft.value.name))
        let hasErrors = false
        for (const key in progress) {
            if (Object.prototype.hasOwnProperty.call(progress, key)) {
                const element = progress[key]
                hasErrors = hasErrors || element.value.failed
            }
        }
        if (hasErrors) {
            dialog.value.error = t("loading.error.failed_download")
            dialog.value.show = true
        } 
        else {
            await startMinecraft()
        }
    } else {
        dialog.value.error = t("loading.error.no_connection")
        dialog.value.show = true
    }
})

</script>

<template>
    <div id="mainview" class="padding fullHeight">
        <v-card height="100%" class="mainWrapper">
            <div class="header">{{$t("loading.title")}}</div>
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
                <span> {{$t("loading.speed")}}</span>
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

