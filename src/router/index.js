import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'src/stores/auth'

export default defineRouter(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Antes de abrir cada tela, confere o login e o perfil (RNF05)
  Router.beforeEach((to) => {
    const auth = useAuthStore(store)

    if (to.meta.publica) {
      // Já logado não precisa ver a tela de login
      return to.path === '/login' && auth.logado ? '/' : true
    }
    if (!auth.logado) {
      auth.sair() // limpa um token vencido que tenha ficado guardado
      return '/login'
    }
    if (to.meta.perfis && !to.meta.perfis.includes(auth.usuario.perfil)) {
      return '/'
    }
    return true
  })

  return Router
})
