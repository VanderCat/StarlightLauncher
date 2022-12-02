<template>
    <div class="control-wrapper">
        <div class="effect"></div>
        <div class="control">
            <div class="btnlist">
                <slot name="left"><playbutton/></slot>
            </div>
            <div class="btnlist">
                <slot name="right"><router-link to="/"><iconbutton/></router-link></slot>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
//TODO: unhardcode
.control-wrapper {
    height: 96px; //sorry for hardcode
    max-height: 96px; //sass variables not working here dunno why
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(2px);
}
.control {
    margin: 16px;
    height: 64px;
    display: flex;
    justify-content: space-between;
    flex-direction: row;
}
.effect {
    width: 100%;
    height: 100%;
    mix-blend-mode: soft-light;
    position: absolute;
    background: linear-gradient(0deg, rgba(213,109,229,0.15) 0%, rgba(213,109,229,0) 50%);
    z-index: -1;
}

.btnlist {
    display: flex;
    flex-direction: row;
    column-gap:16px;
}
</style>

<script setup lang="ts">
import playbutton from './playbutton.vue'
import iconbutton from './iconbutton.vue'
</script>