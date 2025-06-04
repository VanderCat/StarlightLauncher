<script setup lang="ts">
import controls from '../components/controls.vue'
import playbutton from '../components/playbutton.vue'

import { ref, computed, onMounted } from "vue"
import { ipcRenderer } from 'electron';
import _ from "lodash"

import { getProfile } from '../serverapi'
import {ModEntry, Profile} from "../../types/profile"
import { ComputedRef } from 'vue';
import { useRoute, useRouter } from "vue-router"

const router = useRouter()

const modlist = ref<{[key:string]:ModEntry}>({})
const loaded = ref(false)

let filteredMods: ComputedRef<{[key:string]:ModEntry}>
let enabledMods = ref<string[]>([])

// function setModStatus(modname:string, status:boolean){
//     enabledMods.value[modname] = {enabled: status}
// }

onMounted(async ()=>{
    try {

        let modconfig = await ipcRenderer.invoke("loadConfig", "modconfig_dc12")
        console.log("config is empty")
        let cfg = (await (ipcRenderer.invoke("loadConfig", "profiles/dc12") as Promise<Profile>));
        console.log(cfg)
        if (cfg.minecraft.mods == undefined) throw "there is no mods"
        modlist.value = cfg.minecraft.mods
        for (const key in modlist.value) {
            if (Object.prototype.hasOwnProperty.call(modlist.value, key)) {
                const mod = modlist.value[key];
                if (modconfig[key]) {
                    if (modconfig[key].enabled)
                        enabledMods.value.push(key)
                }
                else if (mod.enabled != null && mod.enabled) {
                    enabledMods.value.push(key)
                }

            }
        }
    } 
    catch(err) {
        console.error(err)
        let cfg = await (getProfile("dc12") as Promise<Profile>) // i think i should download all profiles a soon as launcher starts
        if (cfg.minecraft.mods == undefined) throw "there is no mods"
        modlist.value = cfg.minecraft.mods
    }
    
    filteredMods = computed(()=>{
        if (modlist.value == undefined) throw "could not load profile but still atempted to filter mods, why?"
        const filtered:{[key:string]:ModEntry} = {}
        for (const key in modlist.value) {
            if (Object.prototype.hasOwnProperty.call(modlist.value, key)) {
                const mod = modlist.value[key];
                if (mod.visible)
                    filtered[key] = mod
            }
        }
        console.log(filtered)
        return filtered
    })
    loaded.value = true
    console.log(modlist.value)
})

async function save() {
    let selectedMapped: {[key:string]:ModEntry} = {}
    for (const key in modlist.value) {
        if (Object.prototype.hasOwnProperty.call(modlist.value, key)) {
            const mod = modlist.value[key];
            selectedMapped[key] = {enabled: enabledMods.value.includes(key)}
        }
    }
    console.log(await ipcRenderer.invoke("saveConfig", "modconfig_dc12", selectedMapped))
    router.push("/settings")
}
</script>

<template>
    <div id="mainview">
        <div id="freespace">
            <v-card theme="dark" style="height: 100%; overflow: auto;">
                <v-list v-if="loaded" v-model:selected="enabledMods" select-strategy="leaf">
                    <v-list-item v-for="mod, name in filteredMods" :value="name" :disabled="!mod.optional">
                        <template v-slot:prepend="{ isSelected, select }">
                            <v-list-item-action>
                                <v-checkbox-btn :model-value="isSelected" @update:model-value="select"></v-checkbox-btn>
                            </v-list-item-action>
                        </template>
                        <v-list-item-title>{{name}}</v-list-item-title>
                        <v-list-item-subtitle v-if="mod.description">{{mod.description}}</v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </v-card>
        </div>
        <controls>
            <template v-slot:left>
                <playbutton @click="save">{{$t("ok")}}</playbutton>
            </template>
            <template v-slot:right>
                <router-link to="/settings"><playbutton secondary>{{$t("cancel")}}</playbutton></router-link>
            </template>
        </controls>
    </div>
</template>