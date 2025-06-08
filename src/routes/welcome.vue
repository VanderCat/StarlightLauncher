<script async setup lang="ts">
import controls from '../components/controls.vue'

import playbutton from '../components/playbutton.vue'

import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import {onMounted, onUnmounted, ref} from 'vue';
import { AxiosError } from 'axios';
import{ useI18n } from "vue-i18n";
import urls from "../../electron/urllist"
import { ServerDeviceCodeResponse } from 'prismarine-auth';
import { DateTime } from 'luxon';
const router = useRouter();
const auth = useAuthStore();
const errorText = ref<string|null>(null)
function toLogin() {
    router.push("/login2")
}

const dialog = ref({
    show: false,
})
const loggingIn = ref(false)

async function autoLogin() {
    if (auth.mojang) {
        if (auth.user == null) {
            return
        }
        try {
            await auth.loginMojang(auth.user.name, "");
        } catch(err) {
            errorText.value = err as string;
            console.error(err)
            return
        }
    }
    else {
        await auth.refreshLogin();
    }
    await auth.saveLogin();
    if (auth.accessToken != null) {
        router.push("/")
    }
}
async function onStart() {
    loggingIn.value = true;
    await auth.loadLastLogin();
    if (auth.accessToken != null) {
        await autoLogin()
    }
    loggingIn.value = false;
}

onStart();

async function loginMojang() {
    try {
        await auth.loginMojang("starlight", "");
        await auth.saveLogin();
    } catch(err) {
            errorText.value = err as string;
            console.error(err)
    }
}

async function loginAndLeave() {
    loggingIn.value = true
    await loginMojang();
    router.push("/")
    loggingIn.value =false;
}

const Code = ref<ServerDeviceCodeResponse>();

const onMessage = (event:any)=>{
    const code: ServerDeviceCodeResponse | undefined = event.detail;
    console.log(code)
    if (code) {
        dialog.value.show = true
    }
    else {
        dialog.value.show = false
    }
    Code.value = code;
}


onMounted(()=>{
    document.addEventListener("DeviceCode", onMessage)
})
onUnmounted(()=>{
    document.removeEventListener("DeviceCode", onMessage)
})

</script>

<template>
    <div id="mainview" class="nopad center">
        <div class="container">
            <v-card theme="dark" style="overflow: auto">
                <div class="contents">
                    <div class="header login-header">{{$t("welcome.title")}}</div>
                    <div>{{$t("welcome.text")}}</div>
                    <v-card variant="tonal" color="error" class="error" v-if="errorText != null">
                        <v-card-text>
                            <v-icon>mdi-alert-circle-outline</v-icon> {{ errorText.toString() }}
                        </v-card-text>
                    </v-card>
                    <v-btn color="primary" @click="loginAndLeave" :loading="loggingIn">{{$t("welcome.button.xbox")}}</v-btn>
                    <v-btn color="primary" variant="outlined" @click="toLogin">{{$t("welcome.button.custom")}}</v-btn>
                </div>
            </v-card>
        </div>
        <v-dialog
            v-model="dialog.show"
            persistent
        >
            <v-card>
                <v-card-text>
                    {{$t("login.deviceCode", {user_code: Code?.user_code, url: Code?.verification_uri, expires_in:Code?.expires_in??0/60})}}
                    <a :href="Code?.verification_uri+'?otc='+Code?.user_code" target="_blank">{{Code?.verification_uri}}?otc={{Code?.user_code}}</a>
                </v-card-text>
                <v-card-actions>
                    <v-btn
                        :text="$t('login.cancel')"
                        @click="dialog.show = false"
                    ></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>
.nopad {
    padding: 0;
}
.center {
    align-items: center !important;
    justify-items: center !important;
    height: 100vh;
}
.container {
    display: flex;
    align-items: center !important;
    justify-items: center !important;
    height: 100vh;
    padding: 16px;
}
.contents {
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 8px;
    max-width: 376px;
}
.login-header {
    text-align: center;
}
.login-main {
    width: 16rem;
}
.button-disabled {
    opacity: 0.25;
    cursor: default;
}
</style>

