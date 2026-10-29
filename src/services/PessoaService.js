import { api } from 'src/boot/axios'

// Rotas /pessoas da API (padrão dos services da aula)
export default class PessoaService {
  static async listar(params) {
    return new Promise((res, rej) => {
      api
        .get('/pessoas', { params })
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async buscarPorId(id) {
    return new Promise((res, rej) => {
      api
        .get(`/pessoas/${id}`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async criar(data) {
    return new Promise((res, rej) => {
      api
        .post('/pessoas', data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async alterar(id, data) {
    return new Promise((res, rej) => {
      api
        .put(`/pessoas/${id}`, data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async excluir(id) {
    return new Promise((res, rej) => {
      api
        .delete(`/pessoas/${id}`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }
}
