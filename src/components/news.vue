<template>
    <div class="flex">
        <v-card id="news" theme="dark" class="enable-select" width="256" min-width="256px">
            <v-list lines="one">
                <v-list-item v-for="item in headers.updates" :key="item.id" @click="selectID(item.id)" :active="selectedItem==item.id">
                    <v-list-item-title>{{item.title}}</v-list-item-title>
                    <v-list-item-subtitle>{{item.subtitle}}</v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-card>
        <v-card id="currentnews" theme="dark" text="1234" class="enable-select" v-if="loadedNews[selectedItem]">
                <template v-slot:title>
                    {{loadedNews[selectedItem].title}}
                </template>

                <template v-slot:subtitle>
                    {{loadedNews[selectedItem].subtitle}}
                </template>

                <template v-slot:text>
                    <div v-html="loadedNews[selectedItem].contents"/>
                </template>
        </v-card>
    </div>
</template>

<style scoped lang="scss">
    .flex {
        display: flex;
        #news {
            margin-right: 16px;
        }
        #currentnews {
            flex-grow: 1;
        }
        height: 100%;
    }
</style>

<script lang="ts">
const md = require('markdown-it')();
let updates = {}
//await fetch("test/updates.json").then(response => response.json()).then(json => updates = json);
export default {
    data: () => ({
        selectedItem: 1,
        loadedNews: [] as any[],
        headers: updates as any
    }),
    methods: {
        async selectID(id:number) {
            console.log("selected article "+id)
            this.selectedItem = id
            if (!this.loadedNews[id]) {
                console.log("new article")
                const resp = await fetch("test/articles/"+id+".json")
                this.loadedNews[id] = await resp.json()
                this.loadedNews[id].contents = md.render(this.loadedNews[id].contents);
                console.log(this.loadedNews[id])
                console.log("rendered")
            }
        }
    },
    created() {
        console.log("updating")
        this.selectID(this.selectedItem)
    }
}
</script>