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

const { t } = useI18n()

const auth = useAuthStore();
const router = useRouter();

const boolLogingIn = ref(true);
const loginSuccessfull = ref(false);

async function autoLogin() {
    if (auth.mojang) {
        if (auth.user == null) {
            return
        }
        await auth.loginMojang(auth.user.name, "");
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
    await auth.loadLastLogin();
    if (auth.accessToken != null) {
        await autoLogin()
    }
    boolLogingIn.value = false;
}

onStart();

const valid = ref();
const username = ref();
const password = ref();
const errorText = ref(null)

const rules = ref([
    (value: string) => {
        if (value) return true

        return t('login.empty')
    }
])
const passrules = ref([
    (value: string) => {
        //FIXME:
        //console.log(mojang.value);
        //if (mojang.value) return true
        return true;
        //return t('login.empty')
    }
])
async function test() {
    if (!(valid.value||boolLogingIn.value)) return;
    boolLogingIn.value = true;
    try {
        if (mojang.value)
            await loginMojang();
        else
            await loginCustom();
        router.push("/")
    } catch (error) {
        boolLogingIn.value = false
        console.log(error)
        const err = error as AxiosError;
        errorText.value = (err.response?.data as any).errorMessage;
    }
    boolLogingIn.value = false;
}

async function loginCustom() {
    await auth.login(username.value, password.value);
    await auth.saveLogin();
}

async function loginMojang() {
    await auth.loginMojang(username.value, password.value);
    await auth.saveLogin();
}

const mojang = ref(true);

const dialog = ref({
    show: false,
})

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
    <div id="mainview">
        <div id="freespace">
            <v-card theme="dark" style="overflow: auto" height="100% !important">
                <div class="header login-header">{{$t("login.title")}}</div>
                <div class="main">
                    <v-form v-model="valid" class="login-main" :disabled="boolLogingIn">
                        <v-text-field
                            v-model="username"
                            :label="$t('login.username')"
                            :rules="rules"
                            required
                        />
                        <v-text-field
                            v-model="password"
                            :label="$t('login.password')"
                            :rules="passrules"
                            type="password"
                            :required="!mojang"
                            :disabled="mojang"
                        />
                        <v-checkbox :label="$t('login.mojang')" v-model="mojang"></v-checkbox>
                    </v-form>
                    <div v-if="errorText != null">{{ errorText }}</div>
                </div>
            </v-card>
        </div>
        <controls>
            <template v-slot:left>
                <playbutton @click="test" :class="(valid&&!boolLogingIn)?'':'button-disabled'">{{$t('login.button.login')}}</playbutton>
            </template>
            <template v-slot:right>
                <a :href=urls.registerLink target="_blank"><playbutton secondary>{{$t('login.button.register')}}</playbutton></a>
            </template>
        </controls>
        <v-dialog
            v-model="dialog.show"
            persistent
        >
            <v-card>
            <v-card-text>
                {{$t("login.deviceCode", {user_code: Code?.user_code, url: Code?.verification_uri, expires_in:Code?.expires_in??0/60})}}
                <a :href="Code?.verification_uri+'?otc='+Code?.user_code" target="_blank">{{Code?.verification_uri}}?otc={{Code?.user_code}}</a>
            </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>
.login-header {
    text-align: center;
    margin-bottom: 1rem;
}
.login-main {
    width: 16rem;
}
.button-disabled {
    opacity: 0.25;
    cursor: default;
}
</style>

