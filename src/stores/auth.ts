import { defineStore } from 'pinia'
import { ipcRenderer } from 'electron'
import { uniqueId } from 'lodash';
import axios from 'axios';
import urls from "../../electron/urllist"

const baseurl = urls.auth.authHost

export const useAuthStore = defineStore('authStore', {
    state: () : AuthInfo => ({
        accessToken: null,
        uuid: null,
        user: null,
        clientToken: null
      }),
    actions: {
        async loadLastLogin() {
            const account: AuthInfo = await ipcRenderer.invoke("loadLastLogin");
            this.accessToken = account.accessToken
            this.uuid = account.uuid
            this.clientToken = account.clientToken??uniqueId();
        },
        async login(username: string, password: string) {
            const account = await axios.post(baseurl+"/authenticate", {
                username: username,
                password: password
            })

            this.accessToken = account.data.accessToken
            this.clientToken = account.data.clientToken
            try {
                this.uuid = account.data.selectedProfile.id
                this.user = account.data.selectedProfile
            }
            catch (err) {
                console.error("current auth does not support selectedProfile")
            }
        },
        async refreshLogin() {
            const account = await axios.post(baseurl+"/refresh", {
                accessToken: this.accessToken,
                clientToken: this.clientToken
            })
            console.log(account)
            this.accessToken = account.data.accessToken
            this.uuid = account.data.selectedProfile.id
            this.clientToken = account.data.clientToken
            this.user = account.data.selectedProfile
        },
        async saveLogin() {
            await ipcRenderer.invoke("saveLastLogin", {
                accessToken:this.accessToken, 
                uuid:this.uuid, 
                clientToken: this.clientToken, 
                user: {
                    name: this.user?.name
                }
            });
        }
    },
})
