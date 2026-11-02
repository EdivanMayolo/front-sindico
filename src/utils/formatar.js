import { date } from 'quasar'

// A API usa datas AAAA-MM-DD; a tela mostra DD/MM/AAAA (decidido na parte 3 da API)
export const dataBr = (iso) => (iso ? date.formatDate(`${iso}T00:00:00`, 'DD/MM/YYYY') : '')

// "101" com bloco "A" → "101-A"; sem bloco → "101"
export const nomeApto = (apto) => (apto.bloco ? `${apto.numero}-${apto.bloco}` : apto.numero)

// "52998224725" → "529.982.247-25"
export const cpf = (valor) =>
  valor ? valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : ''

export const tipoVinculo = (tipo) => (tipo === 'PROPRIETARIO' ? 'Proprietário' : 'Inquilino')

// Perfis com termos do dia a dia (a API usa ADMIN e COMUM)
export const perfil = (valor) => (valor === 'ADMIN' ? 'Administrador' : 'Consulta')

// 1234.5 → "R$ 1.234,50"
export const dinheiro = (valor) =>
  valor === null || valor === undefined
    ? ''
    : valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Número do relógio e consumo de gás, até 3 casas (DECIMAL(10,3)): 1256.5 → "1.256,5"
export const m3 = (valor) =>
  valor === null || valor === undefined
    ? ''
    : valor.toLocaleString('pt-BR', { maximumFractionDigits: 3 })

// 7 e 2026 → "07/2026"
export const mesAno = (mes, ano) => `${String(mes).padStart(2, '0')}/${ano}`

// Mês em que a fatura é cobrada: o seguinte ao dos gastos (10/2026 → "11/2026"; 12/2026 → "01/2027")
export const mesCobranca = (mes, ano) => (mes === 12 ? mesAno(1, ano + 1) : mesAno(mes + 1, ano))

// Despesa com valor_m3 é a conta de gás (decisão 27A: o síndico vê "Gás", não "Variável")
const TIPOS_DESPESA = { FIXA: 'Fixa', VARIAVEL: 'Variável', OUTROS: 'Outros' }
export const tipoDespesa = (despesa) =>
  despesa.valor_m3 !== null ? 'Gás' : TIPOS_DESPESA[despesa.tipo_despesa]
