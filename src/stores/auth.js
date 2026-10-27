import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'
import AuthService from 'src/services/AuthService'

// O token (JWT) guarda a data de validade no campo "exp" (em segundos).
// O meio do token é base64url: troca - e _ por + e / para o atob() entender.
const tokenValido = (token) => {
  try {
    const meio = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const dados = JSON.parse(atob(meio))
    return dados.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

// Única store do sistema (decisão 4A): o usuário logado é usado em todas as telas.
// Fica também no LocalStorage para continuar logado ao recarregar a página.
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: LocalStorage.getItem('token'),
    usuario: LocalStorage.getItem('usuario'),
  }),

  getters: {
    logado: (state) => !!state.token && tokenValido(state.token),
    isAdmin: (state) => state.usuario?.perfil === 'ADMIN',
  },

  actions: {
    async entrar(data) {
      const response = await AuthService.login(data)
      this.token = response.data.data.token
      this.usuario = response.data.data.usuario
      LocalStorage.set('token', this.token)
      LocalStorage.set('usuario', this.usuario)
    },

    sair() {
      this.token = null
      this.usuario = null
      LocalStorage.remove('token')
      LocalStorage.remove('usuario')
    },
  },
})
