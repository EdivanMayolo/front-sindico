import { date } from 'quasar'

// A API usa datas AAAA-MM-DD; a tela mostra DD/MM/AAAA (decidido na parte 3 da API)
export const dataBr = (iso) => (iso ? date.formatDate(`${iso}T00:00:00`, 'DD/MM/YYYY') : '')

// "101" com bloco "A" → "101-A"; sem bloco → "101"
export const nomeApto = (apto) => (apto.bloco ? `${apto.numero}-${apto.bloco}` : apto.numero)

// "52998224725" → "529.982.247-25"
export const cpf = (valor) =>
  valor ? valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : ''

export const tipoVinculo = (tipo) => (tipo === 'PROPRIETARIO' ? 'Proprietário' : 'Inquilino')
