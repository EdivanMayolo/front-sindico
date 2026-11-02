import { api } from 'src/boot/axios'

// Rotas /faturas da API (padrão dos services da aula).
// A situação da fatura (PATCH /:id/status) está desativada na API.
export default class FaturaService {
  // Filtros (RF17): { id_apartamento, mes, ano }
  static async listar(params) {
    return new Promise((res, rej) => {
      api
        .get('/faturas', { params })
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  // Fatura com os itens
  static async buscarPorId(id) {
    return new Promise((res, rej) => {
      api
        .get(`/faturas/${id}`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  // Gera as faturas de todos os apartamentos do mês: { mes, ano }
  static async gerar(data) {
    return new Promise((res, rej) => {
      api
        .post('/faturas/gerar', data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  // Item avulso (multa, taxa extra): { descricao, valor }
  static async adicionarItem(id, data) {
    return new Promise((res, rej) => {
      api
        .post(`/faturas/${id}/itens`, data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  // Só itens avulsos podem ser removidos
  static async removerItem(id, idItem) {
    return new Promise((res, rej) => {
      api
        .delete(`/faturas/${id}/itens/${idItem}`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }
}
