<template>
    <img :src="src" class="background"/>
</template>
  
<style scoped>
.background {
    object-fit: cover;
    width: 100vw;
    height: 100vh;
    position: absolute;
    -webkit-user-drag: none;
    z-index: -1000;
    overflow: hidden;
}
</style>

<script lang="ts">
export default {
  props: {
    src: {
        type: String,
        default: "img/bgplaceholder.jpeg"
    }
  }
}
</script>