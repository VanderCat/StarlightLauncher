/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface AuthInfo {
  accessToken: string | null,
  clientToken: string | null,
  uuid: string | null,
  user: UserInfo | null,
  mojang: boolean | null
}

interface UserInfo {
  name: string,
  id: string
}