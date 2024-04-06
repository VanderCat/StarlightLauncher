<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, Ref } from 'vue';
import { useRouter } from "vue-router"
import { DateTime } from "luxon"
const router = useRouter()
const Logs = ref<any[]>([])
const LogHolder = ref<HTMLElement>()
const onMessage = (event:any)=>{
    if ( typeof(event.detail) == 'string') {
        Logs.value.push({message:event.detail})
    }
    const message = event.detail
    console.log(message)
    if (!message.minecraftClosed){
        Logs.value.push(message)
        nextTick(()=>{
            if (LogHolder.value)
            if (Math.abs(LogHolder.value.scrollHeight - LogHolder.value.clientHeight - LogHolder.value.scrollTop) < 128)
            LogHolder.value?.lastElementChild?.scrollIntoView({block: 'end'});
        })
    }
    else router.push("/")
}
onMounted(()=>{
    document.addEventListener("MinecraftMessage", onMessage)
})
onUnmounted(()=>{
    document.removeEventListener("MinecraftMessage", onMessage)
})
</script>

<template>
    <div id="mainview" class="padding fullHeight">
        <v-card height="100%" class="mainWrapper padding">
            <div class="header">{{$t("console_title")}}</div>
            <div class="consoleLog" ref="LogHolder">
                <div class="entry" v-for="entry in Logs">
                    <span class="entryDate">{{DateTime.fromMillis(entry.timeMillis??0).toLocaleString(DateTime.TIME_24_WITH_SECONDS)}}</span>
                    <span :class="'level-'+entry.level">[{{entry.thread}}/{{entry.level}}]</span>
                    <span class="entryText">{{entry.message?.replace(/^\s+|\s+$/g, "")}}</span>
                </div>
            </div>
        </v-card>
    </div>
</template>

<style scoped lang="scss">
.padding {
    padding: 16px;
}
.fullHeight {
    height: 100%;
}
.mainWrapper{
    display: flex;
    align-items: stretch;
    flex-direction: column;
    align-items: center;
}

.consoleLog {
    background-color: #0004;
    display: flex;
    width: 100%;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    height: 100%;
    font-family: "Roboto MonoVariable";
}
.entry {
    padding-left: 16px;
    padding-right: 16px;
    font-size: 14px;
    white-space: pre-wrap;
}
.entry:nth-child(even) {
    background-color: #0002;
}

.header {
    margin-bottom: 16px;
    width: calc(100% - 32px);
    font-weight: 900;
    font-size: 20px;
    font-family: "InterVariable";
    color: white;
}

.level- {
    &TRACE {
        //@extend .text-primary-lighten-3
        color: rgba(var(--v-theme-on-surface),0.25)
    }
    &DEBUG {
        //@extend .text-blue-lighten-2
        color: rgba(var(--v-theme-on-surface),0.5)
    }
    &INFO {
        //@extend .text-green
        color: rgb(var(--v-theme-info))
    }
    &WARN {
        //@extend .text-yellow
        color: rgb(var(--v-theme-warning))
    }
    &ERROR {
        //@extend .text-red
        color: rgb(var(--v-theme-error))
    }
    &FATAL {
        //@extend .text-red-darken-2
        color: rgb(var(--v-theme-error))
    }
}

.entryDate {
    color: rgba(var(--v-theme-on-surface),0.175);
}
.entry>span::after {
    content: " ";
}

</style>