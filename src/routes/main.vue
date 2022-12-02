<script setup lang="ts">
import news from '../components/news.vue';
import controls from '../components/controls.vue'

import playbutton from '../components/playbutton.vue'
import iconbutton from '../components/iconbutton.vue'
</script>

<template>
    <div id="mainview">
        <div id="freespace">
            <news/>
        </div>
        <controls>
            <template v-slot:left>
                <router-link to="/play/test"><playbutton>играть</playbutton></router-link>
            </template>
            <template v-slot:right>
                <router-link to="/settings"><iconbutton/></router-link>
            </template>
        </controls>
    </div>
</template>

