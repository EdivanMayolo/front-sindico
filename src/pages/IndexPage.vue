<template>
  <q-page padding>
    <!-- "usuario?." porque, ao clicar em Sair, a tela ainda se redesenha uma vez sem usuário -->
    <div class="text-h5">Olá, {{ usuario?.nome }}!</div>
    <div class="text-subtitle1 text-grey-7 q-mb-md">Bem-vindo ao CondoSimples.</div>

    <!-- Painel (11A / 66A): a situação do condomínio de relance. Cada cartão abre a tela
         dele; quando há algo a fazer, o ADMIN vê o botão do atalho (67A). -->
    <div class="row q-col-gutter-md">
      <div v-for="c in cartoes" :key="c.titulo" class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="full-height column">
          <q-item clickable :to="c.to">
            <q-item-section avatar>
              <q-avatar :icon="c.icone" color="blue-1" text-color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>{{ c.titulo }}</q-item-label>
              <q-item-label v-if="c.carregando"
                ><q-skeleton type="text" width="70%"
              /></q-item-label>
              <q-item-label v-else :class="['text-h6', c.cor]">{{ c.valor }}</q-item-label>
              <q-item-label caption>{{ c.legenda }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-space />
          <q-card-actions v-if="isAdmin && c.acao" align="right">
            <q-btn
              flat
              no-caps
              color="primary"
              :icon="c.acao.icone"
              :label="c.acao.label"
              :to="c.to"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { date } from 'quasar'
import { mapState } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import FinanceiroService from 'src/services/FinanceiroService'
import ApartamentoService from 'src/services/ApartamentoService'
import DespesaService from 'src/services/DespesaService'
import LeituraGasService from 'src/services/LeituraGasService'
import FaturaService from 'src/services/FaturaService'
import mensagemErro from 'src/utils/mensagemErro'
import { dinheiro, mesAno } from 'src/utils/formatar'

// Último mês fechado = mês anterior ao atual (o mês das faturas a gerar)
const ultimoFechado = () => date.addToDate(new Date(), { months: -1 })

export default defineComponent({
  name: 'IndexPage',

  data() {
    // Cada cartão carrega sozinho: se um falhar, os outros aparecem (68A)
    return {
      saldo: null,
      apartamentos: null,
      gas: null,
      faturas: null,
      erros: {},
    }
  },

  computed: {
    ...mapState(useAuthStore, ['usuario', 'isAdmin']),

    cartoes() {
      return [this.cartaoSaldo, this.cartaoApartamentos, this.cartaoGas, this.cartaoFaturas]
    },

    cartaoSaldo() {
      const c = { titulo: 'Saldo do caixa', icone: 'account_balance', to: '/financeiro' }
      if (this.erros.saldo) return { ...c, valor: '—', legenda: this.erros.saldo }
      if (!this.saldo) return { ...c, carregando: true }
      return {
        ...c,
        valor: dinheiro(this.saldo.saldo),
        cor: this.saldo.saldo < 0 ? 'text-negative' : 'text-positive',
        legenda: `Receitas ${dinheiro(this.saldo.total_receitas)} − despesas ${dinheiro(this.saldo.total_despesas)}`,
      }
    },

    cartaoApartamentos() {
      const c = { titulo: 'Apartamentos ativos', icone: 'apartment', to: '/apartamentos' }
      if (this.erros.apartamentos) return { ...c, valor: '—', legenda: this.erros.apartamentos }
      if (!this.apartamentos) return { ...c, carregando: true }
      const comMorador = this.apartamentos.filter((a) => a.moradores).length
      return {
        ...c,
        valor: String(this.apartamentos.length),
        legenda: `${comMorador} com morador cadastrado`,
      }
    },

    cartaoGas() {
      const c = { titulo: 'Leitura de gás', icone: 'local_fire_department', to: '/leituras-gas' }
      if (this.erros.gas) return { ...c, valor: '—', legenda: this.erros.gas }
      if (!this.gas) return { ...c, carregando: true }
      const fechado = ultimoFechado()
      // Atalho para o mês da conta que falta (último mês fechado)
      const toFechado = `/leituras-gas?mes=${fechado.getMonth() + 1}&ano=${fechado.getFullYear()}`
      if (!this.gas.painel) {
        return {
          ...c,
          to: toFechado,
          valor: 'Nenhuma conta',
          cor: 'text-warning',
          legenda: 'Cadastre a conta de gás do mês',
          acao: { label: 'Cadastrar conta', icone: 'add' },
        }
      }
      const p = this.gas.painel
      const legenda = `Conta de ${this.gas.mes}: ${p.total_finalizadas} de ${p.total_apartamentos} finalizados`
      if (!p.completa) {
        return {
          ...c,
          valor: 'Em andamento',
          cor: 'text-warning',
          legenda,
          acao: { label: 'Continuar leituras', icone: 'edit_note' },
        }
      }
      // A última conta está concluída, mas é de antes do último mês fechado: falta a conta nova
      if (this.gas.anoMes < date.formatDate(fechado, 'YYYY-MM')) {
        const nome = date.formatDate(fechado, 'MMMM [de] YYYY').toLowerCase()
        return {
          ...c,
          to: toFechado,
          valor: 'Falta a conta',
          cor: 'text-warning',
          legenda: `Cadastre a conta de ${nome} (a de ${this.gas.mes} está concluída)`,
          acao: { label: 'Cadastrar conta', icone: 'add' },
        }
      }
      return { ...c, valor: 'Concluída', cor: 'text-positive', legenda }
    },

    cartaoFaturas() {
      const mes = ultimoFechado()
      const ref = mesAno(mes.getMonth() + 1, mes.getFullYear())
      const c = { titulo: `Faturas de ${ref}`, icone: 'request_quote', to: '/faturas' }
      if (this.erros.faturas) return { ...c, valor: '—', legenda: this.erros.faturas }
      if (!this.faturas) return { ...c, carregando: true }
      if (!this.faturas.length) {
        return {
          ...c,
          valor: 'Não geradas',
          cor: 'text-warning',
          legenda: 'O mês já fechou: as faturas podem ser geradas',
          acao: { label: 'Gerar faturas', icone: 'playlist_add_check' },
        }
      }
      const centavos = this.faturas.reduce((soma, f) => soma + Math.round(f.valor_total * 100), 0)
      return {
        ...c,
        valor: 'Geradas',
        cor: 'text-positive',
        legenda: `${this.faturas.length} faturas · total ${dinheiro(centavos / 100)}`,
      }
    },
  },

  mounted() {
    this.carregarSaldo()
    this.carregarApartamentos()
    this.carregarGas()
    this.carregarFaturas()
  },

  methods: {
    // Saldo geral (sem período): view vw_saldo da API
    async carregarSaldo() {
      try {
        this.saldo = (await FinanceiroService.saldo()).data.data
      } catch (err) {
        this.erros.saldo = mensagemErro(err)
      }
    },

    async carregarApartamentos() {
      try {
        this.apartamentos = (await ApartamentoService.listar({ ativo: true })).data.data
      } catch (err) {
        this.erros.apartamentos = mensagemErro(err)
      }
    },

    // A conta de gás mais recente é o mês em trabalho (a API obriga terminar um mês antes do outro)
    async carregarGas() {
      try {
        const response = await DespesaService.listar({ tipo_despesa: 'VARIAVEL', ativo: true })
        const conta = response.data.data.find((d) => d.valor_m3 !== null)
        if (!conta) {
          this.gas = { painel: null }
          return
        }
        const painel = (await LeituraGasService.painel(conta.id_despesa)).data.data
        const mes = date.formatDate(`${conta.data_referencia}T00:00:00`, 'MMMM [de] YYYY')
        this.gas = { painel, mes: mes.toLowerCase(), anoMes: conta.data_referencia.slice(0, 7) }
      } catch (err) {
        this.erros.gas = mensagemErro(err)
      }
    },

    // Faturas do último mês fechado (as canceladas não valem)
    async carregarFaturas() {
      const mes = ultimoFechado()
      try {
        const response = await FaturaService.listar({
          mes: mes.getMonth() + 1,
          ano: mes.getFullYear(),
        })
        this.faturas = response.data.data.filter((f) => f.status !== 'CANCELADA')
      } catch (err) {
        this.erros.faturas = mensagemErro(err)
      }
    },
  },
})
</script>
