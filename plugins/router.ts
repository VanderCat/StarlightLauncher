import * as VueRouter from 'vue-router'

import main from "../src/routes/main.vue"

export default VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes: [
        { path: '/', component: main},//() => import('../src/routes/main.vue')},
        { path: '/play/:profile', component: () => import('../src/routes/play.vue')},
        { path: '/console', component: () => import('../src/routes/console.vue')},
        { path: '/settings', component: () => import('../src/routes/settings.vue')},
        { path: '/settings/mods', component: () => import('../src/routes/mods.vue')},
    ]
})
