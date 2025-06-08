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

const boolLogingIn = ref(false);
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

//onStart();

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
async function test() {
    if (!(valid.value||boolLogingIn.value)) return;
    boolLogingIn.value = true;
    try {
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
    if (save.value) await auth.saveLogin();
}

const save = ref(true);

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

function register() {
    window.open(urls.registerLink, "_blank")
}

</script>

<template>
    <div id="mainview" class="nopad center">
        <div class="container">
            <div class="floating-container">
                    <v-btn
                        density="comfortable"
                        icon="mdi-chevron-left"
                        @click="router.back()"
                    />
                </div>
            <v-card theme="dark" style="overflow: auto;">
                <div class="contents">
                    <div class="header login-header">{{$t("login.title")}}</div>
                    <v-card variant="tonal" color="error" class="error" v-if="errorText != null">
                        <v-card-text>
                            <v-icon>mdi-alert-circle-outline</v-icon> {{ errorText }}
                        </v-card-text>
                    </v-card>
                    <v-form v-model="valid" class="login-main" :disabled="boolLogingIn">
                        <v-text-field
                            v-model="username"
                            :label="$t('login.username')"
                            :rules="rules"
                            required
                            variant="underlined"
                            density="compact"
                            color="primary"
                        />
                        <v-text-field
                            v-model="password"
                            :label="$t('login.password')"
                            :rules="rules"
                            type="password"
                            required
                            variant="underlined"
                            density="compact"
                            color="primary"
                        />
                        <!--FIXME: <v-checkbox color="primary" :label="$t('login.save')" v-model="save" density="compact"></v-checkbox>-->
                    </v-form>
                    <v-btn color="primary" @click="test" :loading="boolLogingIn">{{$t("login.button.login")}}</v-btn>
                    <v-btn color="primary" variant="outlined" @click="register">{{$t("login.button.register")}}</v-btn>
                </div>
            </v-card>
        </div>
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
    position: fixed;
}
.contents {
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 8px;
    justify-items: stretch;
    min-width: 344px;
}
.login-header {
    text-align: center;
    margin: 0;
    width: 100%;
    /*margin-bottom: 1rem;*/
}
.login-main {
    width: 100;
}
.button-disabled {
    opacity: 0.25;
    cursor: default;
}
.floating-container {
    position: absolute;
    height: 100%;
    display: flex;
    /*align-items: center;*/
    /*justify-items: center;*/
    left: -32px;
    top: 50%;
}
</style>

