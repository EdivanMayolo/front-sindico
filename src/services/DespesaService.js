import { api } from 'src/boot/axios'

// Rotas /despesas da API (padrão dos services da aula)
export default class DespesaService {
  static async listar(params) {
    return new Promise((res, rej) => {
      api
        .get('/despesas', { params })
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async buscarPorId(id) {
    return new Promise((res, rej) => {
      api
        .get(`/despesas/${id}`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  // Prévia: quanto cada apartamento vai pagar (não grava nada)
  static async rateio(id) {
    return new Promise((res, rej) => {
      api
        .get(`/despesas/${id}/rateio`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async criar(data) {
    return new Promise((res, rej) => {
      api
        .post('/despesas', data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async alterar(id, data) {
    return new Promise((res, rej) => {
      api
        .put(`/despesas/${id}`, data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async excluir(id) {
    return new Promise((res, rej) => {
      api
        .delete(`/despesas/${id}`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }
}
