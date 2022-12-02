<script setup lang="ts">
import controls from '../components/controls.vue'

import playbutton from '../components/playbutton.vue'
</script>

<template>
    <div id="mainview">
        <div id="freespace">
            <v-card theme="dark" text="ну а тут типа моды" style="height: 100%;"></v-card>
        </div>
        <controls>
            <template v-slot:left>
                <playbutton>ок</playbutton>
            </template>
            <template v-slot:right>
                <router-link to="/settings"><playbutton secondary>отмена</playbutton></router-link>
            </template>
        </controls>
    </div>
</template>