<script async setup lang="ts">
import controls from '../components/controls.vue'

import playbutton from '../components/playbutton.vue'

import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import {ref} from 'vue';
import { AxiosError } from 'axios';
import{ useI18n } from "vue-i18n";

const { t } = useI18n()

const auth = useAuthStore();
const router = useRouter();

const boolLogingIn = ref(true);
const loginSuccessfull = ref(false);

async function autoLogin() {
    await auth.refreshLogin();
    await auth.saveLogin();
    if (auth.accessToken != null) {
        router.push("/")
    }
    boolLogingIn.value = false;
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
async function test() {
    if (!(valid.value||boolLogingIn.value)) return;
    boolLogingIn.value = true;
    try {
        await auth.login(username.value, password.value);
        await auth.saveLogin();
        router.push("/")
    } catch (error) {
        console.log(error)
        const err = error as AxiosError;
        errorText.value = (err.response?.data as any).errorMessage;
        boolLogingIn.value = false
    }
    boolLogingIn.value = false;
}

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
                            label="$t('login.password')"
                            :rules="rules"
                            type="password"
                            required
                        />
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
                <a href="https://starlight.vanderc.at/register" target="_blank"><playbutton secondary>{{$t('login.button.register')}}</playbutton></a>
            </template>
        </controls>
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

