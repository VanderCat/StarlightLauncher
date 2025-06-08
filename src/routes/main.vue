<script setup lang="ts">
import news from '../components/news.vue';
import controls from '../components/controls.vue'

import playbutton from '../components/playbutton.vue'
import iconbutton from '../components/iconbutton.vue'

import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
(async ()=>{
    if (auth.accessToken == null) {
        await auth.loadLastLogin()
        if (auth.accessToken == null) {
            router.push("/welcome")
        }
    }
})();
</script>

<template>
    <div id="mainview">
        <div id="freespace">
            <news/>
        </div>
        <controls>
            <template v-slot:left>
                <router-link to="/play/dc12"><playbutton>{{$t("play.button")}}</playbutton></router-link>
            </template>
            <template v-slot:right>
                <router-link to="/settings"><iconbutton/></router-link>
            </template>
        </controls>
    </div>
</template>

