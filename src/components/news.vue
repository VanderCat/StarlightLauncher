<template>
    <div class="flex">
        <v-card id="news" theme="dark" class="enable-select" width="256" min-width="256px">
            <v-list lines="one">
                <v-list-item v-for="item in articles" :key="item.id" @click="selectID(item.id)" :active="selectedItem==item.id">
                    <v-list-item-title>{{item.title}}</v-list-item-title>
                    <v-list-item-subtitle>{{item.subtitle}}</v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-card>
        <v-card id="currentnews" theme="dark" class="enable-select scroll">
                <template v-slot:text v-if="loadedNews[selectedItem]">
                    <div class="news" v-html="loadedNews[selectedItem].contents"/>
                </template>
                <template v-slot:text v-else>
                    <v-progress-circular indeterminate color="primary"/>
                </template>
        </v-card>
    </div>
</template>

<style lang="scss">
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
    .scroll {
        overflow-y: auto;
    }
    .news {
        display: flex;
        flex-direction: column;
        gap: 12px;
        ul {
            margin-left: 2rem;
        }
        h1 {
            margin-top: 0.75rem;
        }
    }
</style>

<script lang="ts">
const mila = require("markdown-it-link-attributes")
const md = require('markdown-it')()
import {listArticles, getArticle} from '../serverapi'
md.use(mila, {
    attrs: {
        target: "_blank",
    },
})
//await fetch("test/updates.json").then(response => response.json()).then(json => updates = json);
export default {
    data: () => ({
        selectedItem: "",
        loadedNews: {} as any,
        articles: [] as any[]
    }),
    methods: {
        async selectID(id:string) {
            console.log("selected article "+id)
            this.selectedItem = id
            if (!this.loadedNews[id]) {
                console.log("new article")
                const resp = await getArticle(id)
                this.loadedNews[id] = {}
                this.loadedNews[id].raw = resp
                this.loadedNews[id].contents = md.render(this.loadedNews[id].raw);
                console.log(this.loadedNews[id])
                console.log("rendered")
            }
        },
        async loadNews() {
            this.articles = await listArticles()
            this.selectedItem = this.articles[0].id
        }
    },
    created() {
        console.log("updating")
        this.loadNews().then(()=>{
            this.selectID(this.selectedItem)
        })
    }
}
</script>