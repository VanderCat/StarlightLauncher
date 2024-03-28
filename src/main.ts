import { createApp } from 'vue'
import App from './App.vue'

import router from "../plugins/router"
import vuetify from "../plugins/vuetify"
import pinia from "../plugins/pinia"
import VueVirtualScroller from 'vue-virtual-scroller'

import "@fontsource/inter"
import "@fontsource/inter/variable-full.css";
import "@fontsource/roboto-mono"
import "@fontsource/roboto-mono/variable-full.css";
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import "./main.css"

createApp(App)
  .use(vuetify)
  .use(router)
  .use(pinia)
  .use(VueVirtualScroller)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })


import { ipcRenderer } from 'electron'
ipcRenderer.on('minecraft-log', (e:Event, text:Uint8Array)=>{
  const buffer = Buffer.from(text)
  const string = buffer.toString("utf-8")
  try {
    string.split("\n").forEach(msg => {
      if (msg!=""){
      const parsedMsg = JSON.parse(msg)
      const event = new CustomEvent("MinecraftMessage", {detail:parsedMsg})
      document.dispatchEvent(event)
      }
    });
  } 
  catch (err) {
    console.warn(err)
    console.log(string)
    const event = new CustomEvent("MinecraftMessage", {detail:string})
    document.dispatchEvent(event)
  }
})