import { api } from 'src/boot/axios'

// Rotas /receitas da API (padrão dos services da aula).
// Receita = dinheiro que entra no caixa (ex.: pagamento de fatura, lançado à mão).
export default class ReceitaService {
  // Filtros: { mes, ano } da data de recebimento
  static async listar(params) {
    return new Promise((res, rej) => {
      api
        .get('/receitas', { params })
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async criar(data) {
    return new Promise((res, rej) => {
      api
        .post('/receitas', data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async alterar(id, data) {
    return new Promise((res, rej) => {
      api
        .put(`/receitas/${id}`, data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  // Exclui de verdade (a receita não é usada por outra tabela)
  static async excluir(id) {
    return new Promise((res, rej) => {
      api
        .delete(`/receitas/${id}`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }
}
