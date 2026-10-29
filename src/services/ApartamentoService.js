import { api } from 'src/boot/axios'

// Rotas /apartamentos da API (padrão dos services da aula).
// Apartamento não é excluído (RN01): só inativado.
export default class ApartamentoService {
  static async listar(params) {
    return new Promise((res, rej) => {
      api
        .get('/apartamentos', { params })
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async buscarPorId(id) {
    return new Promise((res, rej) => {
      api
        .get(`/apartamentos/${id}`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async criar(data) {
    return new Promise((res, rej) => {
      api
        .post('/apartamentos', data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async alterar(id, data) {
    return new Promise((res, rej) => {
      api
        .put(`/apartamentos/${id}`, data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async inativar(id) {
    return new Promise((res, rej) => {
      api
        .patch(`/apartamentos/${id}/inativar`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async ativar(id) {
    return new Promise((res, rej) => {
      api
        .patch(`/apartamentos/${id}/ativar`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }
}
