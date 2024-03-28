<script setup lang="ts">
import controls from '../components/controls.vue'
import playbutton from '../components/playbutton.vue'

import { ref, computed, onMounted } from "vue"
import { ipcRenderer } from 'electron';
import _ from "lodash"

import { getProfile } from '../serverapi'

const cfg = ref<any>({})
const loaded = ref(false)

let filteredMods:any

onMounted(async ()=>{
    try {
        cfg.value = await ipcRenderer.invoke("loadConfig", "profiles/agusha")
        if (cfg.value == null) throw "config is empty"
    } 
    catch(err) {
        cfg.value = await getProfile("test") // i think i should download all profiles a soon as launcher starts
    }
    filteredMods = computed(()=>{
        const filtered:{[key:string]:any} = {}
        for (const key in cfg.value.minecraft.mods) {
            if (Object.prototype.hasOwnProperty.call(cfg.value.minecraft.mods, key)) {
                const mod = cfg.value.minecraft.mods[key];
                if (mod.visible)
                filtered[key] = mod
            }
        }
        console.log(filtered)
        return filtered
    })
    loaded.value = true
    console.log(cfg.value)
})

function test() {
    for (const key in cfg.value.minecraft.mods) {
        if (Object.prototype.hasOwnProperty.call(cfg.value.minecraft.mods, key)) {
            const mod = cfg.value.minecraft.mods[key];
            if (mod.visible)
                console.log(mod)
        }
    }
}
</script>

<template>
    <div id="mainview">
        <div id="freespace">
            <v-card theme="dark" style="height: 100%; overflow: auto;">
                <v-list v-if="loaded">
                    <v-list-item v-for="mod, name in filteredMods">
                        <template v-slot:prepend="{ isActive }">
                            <v-list-item-action start>
                                <v-checkbox-btn v-model="mod.enabled"></v-checkbox-btn>
                            </v-list-item-action>
                        </template>
                        <v-list-item-title>{{name}}</v-list-item-title>
                        <v-list-item-subtitle>{{mod.description}}</v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </v-card>
        </div>
        <controls>
            <template v-slot:left>
                <playbutton @click="test">ок</playbutton>
            </template>
            <template v-slot:right>
                <router-link to="/settings"><playbutton secondary>отмена</playbutton></router-link>
            </template>
        </controls>
    </div>
</template>