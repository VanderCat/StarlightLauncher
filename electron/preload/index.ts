import {contextBridge, ipcRenderer } from "electron"

function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const styleContent = `
  import "@fontsource/inter/variable-full.css";
  :root { font-family: 'Inter', sans-serif; }
  @supports (font-variation-settings: normal) {
    :root { font-family: 'Inter var', sans-serif; }
  }
  body {
    padding:0;
    margin:0;
  }
  
  .loadingWrapper {
    display: flex;
    width: 100wh;
    height: 100vh;
    align-content: center;
    align-items: center;
    justify-content: center;
    background-color: #121212;
  }
  
  .loadingText {
    font-weight: 900;
    font-size: 48pt;
    color: white;
    background-image: linear-gradient(90deg, rgba(0,0,0,0.25) 25%, rgba(213,109,229,0.75) 50%, rgba(0,0,0,0.25) 75%);
    background-size: 600% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: loading 1.5s ease-in-out infinite;
  }
  
  @keyframes loading {
    0% { background-position: 0% 0%; }
    100% { background-position: 100% 0%; }
  }
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'loadingWrapper'
  oDiv.innerHTML = `<div class="loadingText">Starlight Launcher</div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = ev => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)
