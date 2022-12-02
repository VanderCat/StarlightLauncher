<script setup lang="ts">
import background from './components/background.vue';

import { useJvmSettingsStore } from './stores/jvmSettings';
const jvm = useJvmSettingsStore()
jvm.loadSettings()
</script>

<template>
  <background/>
  <router-view/>
</template>

<style>
#app {
  overflow: hidden;
}
.enable-select { 
  user-select: text;
}
#freespace {
  padding: 16px;
  flex-grow: 1;
  max-height: calc(100vh - 96px);/*i dont think this is a good idea but i'll leave it as is*/
}
#mainview {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100vh;
}
</style>
