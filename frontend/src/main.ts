import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import QrcodeVue from 'qrcode.vue'
import * as Vue from 'vue' // in Vue 3
import axios from 'axios'
import VueAxios from 'vue-axios'
import gridShortcut from '@/components/gridShortcut.vue';
import customSelect from "@/components/custom-dropdown.vue";
import faIcon from "@/components/faIcon.vue";

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(VueAxios, axios)
app.component("qrcode", QrcodeVue)
app.component("gridShortcut", gridShortcut);
app.component("custom-select", customSelect);
app.component("fa-icon", faIcon);

app.mount('#app')
