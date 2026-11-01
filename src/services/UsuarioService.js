import { api } from 'src/boot/axios'

// Rotas /usuarios da API — todas só para ADMIN (padrão dos services da aula).
// Não existe excluir: para bloquear o acesso, alterar com ativo = false.
export default class UsuarioService {
  static async listar() {
    return new Promise((res, rej) => {
      api
        .get('/usuarios')
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async buscarPorId(id) {
    return new Promise((res, rej) => {
      api
        .get(`/usuarios/${id}`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async criar(data) {
    return new Promise((res, rej) => {
      api
        .post('/usuarios', data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async alterar(id, data) {
    return new Promise((res, rej) => {
      api
        .put(`/usuarios/${id}`, data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  // O ADMIN define uma senha nova para quem esqueceu (não pede a senha atual)
  static async redefinirSenha(id, data) {
    return new Promise((res, rej) => {
      api
        .patch(`/usuarios/${id}/senha`, data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }
}
