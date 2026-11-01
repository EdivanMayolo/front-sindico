import { api } from 'src/boot/axios'

// Rotas /leituras-gas da API (padrão dos services da aula).
// A leitura em andamento só é corrigida (decisão 43A): o front não usa o DELETE.
export default class LeituraGasService {
  // Painel da tela: os apartamentos do mês em ordem, com a situação de cada um
  static async painel(idDespesa) {
    return new Promise((res, rej) => {
      api
        .get(`/leituras-gas/despesa/${idDespesa}`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async criar(data) {
    return new Promise((res, rej) => {
      api
        .post('/leituras-gas', data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  static async alterar(id, data) {
    return new Promise((res, rej) => {
      api
        .put(`/leituras-gas/${id}`, data)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }

  // O banco calcula o valor (consumo × preço do m³) e trava a leitura
  static async finalizar(id) {
    return new Promise((res, rej) => {
      api
        .patch(`/leituras-gas/${id}/finalizar`)
        .then((response) => res(response))
        .catch((err) => rej(err.response))
    })
  }
}
