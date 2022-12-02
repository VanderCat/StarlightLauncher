import vue from "vue"
interface Progress {
    [key: string]: any
    name: string,
    downloaded: boolean,
    started: boolean,
    maxSize: number,
    currentSize: number,
    downloadSpeed: number,
    failed: boolean
}
interface ProgressHolder {
    [key: string]: vue.Ref<Progress>
}