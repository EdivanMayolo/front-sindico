import { api } from 'src/boot/axios'

// Rotas /financeiro da API: só consulta. Movimentação e saldo vêm das views do banco
// (receitas = entradas, despesas ativas = saídas).
export default class FinanceiroService {
  // Extrato: { data_inicio, data_fim, tipo } (tipo = ENTRADA ou SAIDA)
  static async movimentacao(params) {
    return new Promise((res, rej) => {
      api
        .get('/financeiro/movimentacao', { params })
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  // Sem período: saldo geral do caixa. Com { data_inicio, data_fim }: saldo anterior,
  // entradas, saídas e saldo final do período.
  static async saldo(params) {
    return new Promise((res, rej) => {
      api
        .get('/financeiro/saldo', { params })
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }
}
