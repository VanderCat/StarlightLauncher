import * as VueRouter from 'vue-router'

import main from "../src/routes/main.vue"
import login from "../src/routes/login.vue"
import play from "../src/routes/play.vue";
import console from "../src/routes/console.vue";
import settings from "../src/routes/settings.vue";
import mods from "../src/routes/mods.vue";

export default VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes: [
        { path: '/', component: main},
        { path: "/login", component: login},
        { path: '/play/:profile', component: play},
        { path: '/console', component: console},
        { path: '/settings', component: settings},
        { path: '/settings/mods', component: mods},
    ]
})
