import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import QrcodeVue from 'qrcode.vue'
import * as Vue from 'vue' // in Vue 3
import axios from 'axios'
import VueAxios from 'vue-axios'
import gridShortcut from '@/components/gridShortcut.vue'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(VueAxios, axios)
app.component("qrcode", QrcodeVue)
app.component("gridShortcut", gridShortcut);

app.mount('#app')
