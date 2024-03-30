import Axios from "axios"
import { ipcRenderer } from "electron"
import { app } from "@electron/remote"
import yaml from "yaml"
import path from "node:path"
const os = require("node:os")

export const url = 'https://play.vanderc.at/'//'http://starlight.vanderc.at/api/' // CHANGEME

export async function apiRequest(endpoint:string, data:any) {
    const response = await Axios.post(url+"api/"+endpoint, data)
    if (!response.data.error) return response.data; else throw response.data.error
}

export async function getPackageInfo(packageName: string) {
    return (await apiRequest("package.get", {name:packageName})).package.files as any[];
}

export async function getJavaInfo(cfg:any) {
    return (await apiRequest("package.getJava", {java:cfg.minecraft.java, arch:os.arch(), platform:os.platform()})).package.files as any[];
}

export async function getProfile(profileName: string) {
    try {
        const profile = await apiRequest("profiles.get", {name: profileName+".yml"})
        ipcRenderer.invoke("writefile", path.resolve(app.getPath("userData"), "profiles", profileName+".yml"), profile)
        return yaml.parse(profile) 
    }
    catch {
        return false
    }
}

export async function listArticles() {
    try {
        const response = await Axios.get(url+"api/articles.list")
        if (!response.data.error) return response.data; else throw response.data.error
    }
    catch {
        return false
    }
}
export async function getArticle(articleId: string) {
    try {
        return apiRequest("articles.get", {name:articleId})
    }
    catch {
        return false
    }
}