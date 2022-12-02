<template>
    <button type="button" :class='secondary?"secondary":""' class="bigbutton"><span><slot>button</slot></span></button>
</template>

<style scoped lang="scss">
    .bigbutton {
        font-family: "InterVariable";
        cursor: pointer;
        display: inline-block;
        height: 64px;
        font-size: 35px;
        font-weight: 900;
        color: white;
        background-color: #D56DE5;
        border: 0;
        border-radius: 8px;
        box-shadow: 0 0 16px 0 #d56de580;
        transition-property: box-shadow background-color;
        transition-duration: 100ms;
        padding-left: 48px;
        padding-right:48px;
        vertical-align: middle;
        &:hover {
            box-shadow: 0 0 20px 4px #d56de590;
        }
        &:active {
            box-shadow: 0 0 20px 8px #d56de5C4;
            background-color: #e5a2f0;
        }
    }
    .secondary {
        background: none;
        box-shadow: none;
        padding-left: 24px;
        padding-right:24px;
        &:hover {
            box-shadow: none;
            background-color: rgba(255,255,255,0.1);
        }
        &:active {
            background-color: rgba(255,255,255,0.20);
        }
    }
</style>

<script setup lang="ts">
defineProps({
  secondary: Boolean,
})
</script>