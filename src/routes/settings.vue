<script async setup lang="ts">
import controls from '../components/controls.vue'

import playbutton from '../components/playbutton.vue'

import {VList, VListItem, VListItemAction, VListSubheader} from 'vuetify/components/VList';
import { VSlider } from 'vuetify/components/VSlider';
import { VForm } from 'vuetify/components/VForm';
import { VTextField } from 'vuetify/components/VTextField';
import path from 'node:path';

import { useJvmSettingsStore } from '../stores/jvmSettings'
import { useRouter } from 'vue-router'
import { ref } from 'vue';
import{ useI18n } from "vue-i18n";
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const { t } = useI18n()

const jvm = useJvmSettingsStore()
const router = useRouter()

jvm.loadSettings()
function getFile() {
    const dir = dialog.showOpenDialogSync({
        title: t("java.dialog.title"),
        properties: [
            "openDirectory",
            "treatPackageAsDirectory"
        ]
    })
    console.log(dir)
    if (dir != undefined) {
        jvm.javaPath = dir[0]
    }
}

const form = ref<InstanceType<typeof VForm> | null>();

async function save() {
    const result = await form.value?.validate()
    if (result?.valid) {
        jvm.saveSettings()
        router.push('/')
    }
}

async function unlogin() {
    auth.removeLogin()
    router.push('/login')
}
</script>

<template>
    <div id="mainview">
        <div id="freespace">
            <v-card theme="dark" style="overflow: auto" height="100% !important">
                <v-form ref="form">
                <v-list lines="one">
                    <v-list-subheader>{{$t("settings.java.title")}}</v-list-subheader>

                    <v-list-item>
                        <template v-slot:prepend="{ isActive }">

                        <v-list-item-action start>
                            <v-checkbox-btn color="primary" v-model="jvm.bundledJava"></v-checkbox-btn>
                        </v-list-item-action>
                        </template>

                        <v-list-item-title>{{$t("settings.java.use_bundled")}}</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                        <v-text-field color="primary" density="compact" :label="$t('settings.java.path_hint')" v-model="jvm.javaPath" :disabled="jvm.bundledJava" :rules="[rules.validPath]" append-icon="mdi-file-search" @click:append="getFile"></v-text-field>
                    </v-list-item>
                    <v-list-item>
                        <v-slider color="primary" density="compact" step="512" min="1024" :label="$t('settings.java.ram')" :max="Math.min(8192,maxRam)" variant="underlined" show-ticks v-model="jvm.ram" :rules="[rules.notExceedMaxRam]">
                            <template v-slot:append>
                                <v-text-field v-model="jvm.ram" hide-details single-line density="compact"  style="width: 70px" :rules="[rules.numOnly, rules.notExceedMaxRam]"/>
                            </template>
                        </v-slider>
                    </v-list-item>
                    <v-list-item>
                        <v-textarea color="primary" density="compact" :label="$t('settings.java.args')" v-model="jvm.javaArgs"></v-textarea>
                    </v-list-item>
                    <v-list-item>
                        <v-btn color="primary" @click="unlogin">{{$t('login.button.unlogin')}}</v-btn>
                    </v-list-item>
                </v-list></v-form>
            </v-card>
        </div>
        <controls>
            <template v-slot:left>
                <playbutton @click="save">{{ $t('ok') }}</playbutton>
                <router-link to="/settings/mods"><playbutton secondary>{{$t('settings.mods')}}</playbutton></router-link>
            </template>
            <template v-slot:right>
                <router-link to="/"><playbutton secondary>{{$t('cancel')}}</playbutton></router-link>
            </template>
        </controls>
    </div>
</template>

<script lang="ts">
import { dialog } from '@electron/remote'

const maxRam = process.getSystemMemoryInfo().total/1024
  export default {
    data () {
      return {
        rules: {
            numOnly: (value: string) => {
                const pattern = /^[0-9]+$/
                return pattern.test(value) || 'settings.java.error.notANumber'
            },
            notExceedMaxRam: (value: number) => {
                return maxRam > value || 'settings.java.error.excessRam'
            },
            validPath: (value: string) => {
                return path.isAbsolute(value) || value=="" || 'settings.java.error.wrongPath'
            }
        },
        maxRam
      }
    }
  }
</script>