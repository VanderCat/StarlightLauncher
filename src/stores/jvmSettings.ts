import { defineStore } from 'pinia'
import { ipcRenderer } from 'electron'

export const useJvmSettingsStore = defineStore('jvmSettings', {
    state: () => ({
        bundledJava: true,
        javaPath: "",
        javaArgs: "",
        ram: 2048,
        old: {
            bundledJava:true, 
            javaPath:"", 
            javaArgs:"", 
            ram:2048
        }
    }),
    actions: {
        async loadSettings() {
            console.log("[JVM Store] Loading settings")
            const cfg = await ipcRenderer.invoke("loadConfig", "jvm")
            if ((typeof cfg == "object")&&(cfg!=null)) {
                this.old = {
                    bundledJava:this.bundledJava, 
                    javaPath:this.javaPath, 
                    javaArgs:this.javaArgs, 
                    ram:this.ram
                }
                this.$patch(cfg)
                console.log("[JVM Store] Successfully loaded settings from jvm.yml")
            } 
            else {
                console.log(`[JVM Store] Failed to load settings as it's type is ${typeof cfg}(${cfg})`)
                this.saveSettings()
            }
        },
        async saveSettings() {
            console.log("[JVM Store] saving settings")
            if (await ipcRenderer.invoke("saveConfig", "jvm", {bundledJava:this.bundledJava, javaPath:this.javaPath, javaArgs:this.javaArgs, ram:this.ram})) {
                console.log("[JVM Store] Successfully saved settings in jvm.yml")
            } 
            else {
                console.log(`[JVM Store] couldn't save the config!`)
            }
        }
    },
})
