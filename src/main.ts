import { createApp } from 'vue'
import { Quasar, Dialog, Notify } from 'quasar'
import { createPinia } from 'pinia'
import App from './App.vue'

import './styles/quasar.sass'
import './styles/global.css'
import 'leaflet/dist/leaflet.css'

const app = createApp(App)

app.use(createPinia())
app.use(Quasar, {
  plugins: { Dialog, Notify },
  config: {
    notify: {
      position: 'top',
      timeout: 2500,
    },
  },
})

app.mount('#app')
