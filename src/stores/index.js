import { defineStore } from '#q-app/wrappers'
import { createPinia } from 'pinia'

// Liga o Pinia ao Quasar (arquivo padrão gerado pelo npm init quasar)
export default defineStore(() => {
  const pinia = createPinia()
  return pinia
})
