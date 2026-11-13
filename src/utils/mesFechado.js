import { date } from 'quasar'
import FaturaService from 'src/services/FaturaService'

// Mês fechado: as faturas dele (ou de um mês posterior) já foram geradas.
// Esse mês e os anteriores não recebem despesa nova (regra da API); as telas
// desabilitam os botões de cadastro em vez de esperar a mensagem de erro.

// Último mês com faturas geradas (canceladas não contam), como Date do dia 1; null se nenhum
export async function ultimoMesGerado() {
  const response = await FaturaService.listar()
  const meses = response.data.data
    .filter((f) => f.status !== 'CANCELADA')
    .map((f) => new Date(f.ano_referencia, f.mes_referencia - 1, 1).getTime())
  return meses.length ? new Date(Math.max(...meses)) : null
}

// primeiroDia: Date do dia 1 do mês da tela
export const mesFechado = (primeiroDia, ultimoGerado) =>
  !!ultimoGerado && primeiroDia <= ultimoGerado

// Primeiro dia que ainda aceita despesa (AAAA-MM-DD): dia 1 do mês seguinte ao último gerado
export const primeiroDiaAberto = (ultimoGerado) =>
  ultimoGerado ? date.formatDate(date.addToDate(ultimoGerado, { months: 1 }), 'YYYY-MM-DD') : null
