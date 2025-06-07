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
import { createI18n } from 'vue-i18n'
import locale from "./translations"

const i18n = createI18n({
  locale: navigator.language.split("-")[0],
  legacy: false,
  fallbackLocale: 'en',
  messages: locale
})

createApp(App)
  .use(vuetify)
  .use(router)
  .use(pinia)
  .use(VueVirtualScroller)
  .use(i18n)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })


import { ipcRenderer } from 'electron'
ipcRenderer.on('minecraft-log', (e, text:string)=>{
  //const buffer = Buffer.from(text)
  //const string = buffer.toString("utf-8")
  try {
    text.split("\n").forEach(msg => {
      if (msg!="") {
        const parsedMsg = JSON.parse(msg)
        const event = new CustomEvent("MinecraftMessage", {detail:parsedMsg})
        document.dispatchEvent(event)
      }
    });
  } 
  catch (err) {
    console.warn(err)
    console.log(text)
    const event = new CustomEvent("MinecraftMessage", {detail:text})
    document.dispatchEvent(event)
  }
})
import { ServerDeviceCodeResponse } from 'prismarine-auth'

ipcRenderer.on('deviceCode', (e, code:ServerDeviceCodeResponse)=>{
  const event = new CustomEvent("DeviceCode", {detail:code})
  console.log(code)
  document.dispatchEvent(event)
})