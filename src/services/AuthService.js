import { api } from 'src/boot/axios'

// Rotas de login da API (/auth). Mesmo padrão dos services da aula:
// cada método devolve a resposta da API ou rejeita com err.response.
export default class AuthService {
  static async login(data) {
    return new Promise((res, rej) => {
      api
        .post('/auth/login', data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async meusDados() {
    return new Promise((res, rej) => {
      api
        .get('/auth/me')
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async alterarMinhaSenha(data) {
    return new Promise((res, rej) => {
      api
        .patch('/auth/senha', data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }
}
