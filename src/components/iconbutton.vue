<template>
    <button type="button" class="bigbutton"><span><v-icon icon="mdi-cog" color="#fff" size="32px"></v-icon></span></button>
</template>

<style scoped lang="scss">
    .bigbutton {
        cursor: pointer;
        display: inline-block;
        height: 64px;
        width: 64px;
        background-color: #D56DE5;
        border: 0;
        border-radius: 32px;
        box-shadow: 0 0 16px 0 #d56de580;
        transition-property: box-shadow background-color;
        transition-duration: 100ms;
        vertical-align: middle;
        &:hover {
            box-shadow: 0 0 20px 4px #d56de590;
        }
        &:active {
            box-shadow: 0 0 20px 8px #d56de5C4;
            background-color: #e5a2f0;
        }
    }
</style>

<script setup lang="ts">
defineProps({
  icon: String,

})
</script>