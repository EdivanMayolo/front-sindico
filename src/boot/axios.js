import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

// Endereço da API (api-sindico)
const api = axios.create({ baseURL: 'http://localhost:3000' })

export default defineBoot(({ app, router, store }) => {
  const auth = useAuthStore(store)

  // Toda chamada leva o token do usuário logado
  api.interceptors.request.use((config) => {
    if (auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`
    }
    return config
  })

  // Token vencido ou inválido (401): sai do sistema e volta para o login.
  // O 401 do próprio login (senha errada) é tratado na tela de login.
  api.interceptors.response.use(
    (response) => response,
    (err) => {
      if (err.response?.status === 401 && err.config.url !== '/auth/login') {
        auth.sair()
        Notify.create({ type: 'warning', message: err.response.data.message })
        router.push('/login')
      }
      return Promise.reject(err)
    },
  )

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
