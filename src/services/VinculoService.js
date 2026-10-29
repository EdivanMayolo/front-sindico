import { api } from 'src/boot/axios'

// Rotas /vinculos da API (padrão dos services da aula).
// Vínculo não é excluído: é encerrado e fica no histórico.
export default class VinculoService {
  static async listar(params) {
    return new Promise((res, rej) => {
      api
        .get('/vinculos', { params })
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async criar(data) {
    return new Promise((res, rej) => {
      api
        .post('/vinculos', data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async alterar(id, data) {
    return new Promise((res, rej) => {
      api
        .put(`/vinculos/${id}`, data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async encerrar(id, data) {
    return new Promise((res, rej) => {
      api
        .patch(`/vinculos/${id}/encerrar`, data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }
}
