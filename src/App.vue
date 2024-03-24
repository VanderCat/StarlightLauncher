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
.padding {
    padding: 16px;
}
.fullHeight {
    height: 100%;
}
.mainWrapper{
    display: flex;
    align-items: stretch;
    flex-direction: column;
    align-items: center;
}
.main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    align-content: center;
    justify-content: center;
}

.header {
    margin-left: 16px;
    margin-top: 16px;
    width: calc(100% - 32px);
    font-weight: 900;
    font-size: 20px;
    font-family: "InterVariable";
    color: white;
}
</style>
