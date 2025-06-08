import * as VueRouter from 'vue-router'

import main from "../src/routes/main.vue"
import login from "../src/routes/login.vue"
import login2 from "../src/routes/login2.vue"
import play from "../src/routes/play.vue";
import console from "../src/routes/console.vue";
import settings from "../src/routes/settings.vue";
import mods from "../src/routes/mods.vue";
import welcome from "../src/routes/welcome.vue"

export default VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes: [
        { path: '/', component: main},
        { path: '/welcome', component: welcome},
        { path: "/login", component: login},
        { path: "/login2", component: login2},
        { path: '/play/:profile', component: play},
        { path: '/console', component: console},
        { path: '/settings', component: settings},
        { path: '/settings/mods', component: mods},
    ]
})
