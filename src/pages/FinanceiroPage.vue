<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5">Financeiro</div>
        <!-- Só no papel (print-only, classe do Quasar) -->
        <div class="print-only text-subtitle1 text-grey-8">CondoSimples — prestação de contas</div>
      </div>
      <q-space />
      <!-- 64A: prestação de contas do mês no papel (mesma impressão do esboço da fatura) -->
      <q-btn
        unelevated
        color="primary"
        icon="print"
        label="Imprimir"
        class="print-hide"
        @click="imprimir"
      />
    </div>

    <!-- 62A: por mês, como as outras telas -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="chevron_left" class="print-hide" @click="mudarMes(-1)">
        <q-tooltip>Mês anterior</q-tooltip>
      </q-btn>
      <div class="text-h6 q-mx-sm">{{ nomeMes }}</div>
      <q-btn flat round icon="chevron_right" class="print-hide" @click="mudarMes(1)">
        <q-tooltip>Próximo mês</q-tooltip>
      </q-btn>
      <q-btn
        v-if="!ehMesAtual"
        flat
        dense
        no-caps
        color="primary"
        label="Mês atual"
        class="print-hide"
        @click="irParaMesAtual"
      />
    </div>

    <!-- 63A: saldo do mês em 4 cartões (saldo anterior + entradas − saídas = saldo final) -->
    <div class="row q-col-gutter-md q-mb-md">
      <div v-for="c in cartoes" :key="c.titulo" class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">{{ c.titulo }}</div>
            <div :class="['text-h6', c.cor]">
              <q-skeleton v-if="!saldo" type="text" />
              <template v-else>{{ c.valor }}</template>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">Movimentação</div>
      <q-space />
      <q-btn-toggle
        v-model="tipo"
        class="print-hide"
        no-caps
        unelevated
        toggle-color="primary"
        :options="TIPOS"
        @update:model-value="carregarMovimentacao"
      />
    </div>
    <div class="text-caption text-grey-7 q-mb-sm">
      Entradas são as receitas (data de recebimento). Saídas são as despesas ativas (data de
      referência); o gás entra pelo valor da conta.
    </div>

    <!-- Sem paginação: na impressão sai o mês inteiro -->
    <q-table
      :rows="movimentos"
      :columns="colunas"
      :row-key="(row) => row.tipo + row.id_origem"
      :loading="carregando"
      :grid="$q.screen.xs"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      flat
      bordered
      no-data-label="Nenhuma movimentação neste mês."
    >
      <template #body-cell-tipo="props">
        <q-td :props="props">
          <q-badge :color="props.row.tipo === 'ENTRADA' ? 'positive' : 'negative'">
            {{ props.value }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-valor="props">
        <q-td
          :props="props"
          :class="props.row.tipo === 'ENTRADA' ? 'text-positive' : 'text-negative'"
        >
          {{ props.value }}
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { date } from 'quasar'
import FinanceiroService from 'src/services/FinanceiroService'
import mensagemErro from 'src/utils/mensagemErro'
import { dataBr, dinheiro } from 'src/utils/formatar'

const TIPOS = [
  { label: 'Todas', value: null },
  { label: 'Entradas', value: 'ENTRADA' },
  { label: 'Saídas', value: 'SAIDA' },
]

// Cor do saldo: verde positivo, vermelho negativo
const corSaldo = (valor) => (valor < 0 ? 'text-negative' : 'text-positive')

// "+R$ 480,00" / "-R$ 200,00"; zero fica sem sinal (R$ 0,00)
const comSinal = (valor, sinal) => (valor ? `${sinal}${dinheiro(valor)}` : dinheiro(valor))

export default defineComponent({
  name: 'FinanceiroPage',

  data() {
    const hoje = new Date()
    return {
      TIPOS,
      mes: hoje.getMonth() + 1,
      ano: hoje.getFullYear(),
      tipo: null,
      saldo: null,
      movimentos: [],
      carregando: false,
      colunas: [
        {
          name: 'data',
          label: 'Data',
          field: 'data',
          align: 'left',
          sortable: true,
          format: dataBr,
        },
        {
          name: 'descricao',
          label: 'Descrição',
          field: 'descricao',
          align: 'left',
          sortable: true,
        },
        {
          name: 'tipo',
          label: 'Tipo',
          field: 'tipo',
          align: 'center',
          format: (v) => (v === 'ENTRADA' ? 'Entrada' : 'Saída'),
        },
        {
          name: 'valor',
          label: 'Valor',
          field: 'valor',
          align: 'right',
          sortable: true,
          // Sinal junto do valor, no mesmo formato do saldo negativo (-R$ 200,00): + entrada, - saída
          format: (v, row) => comSinal(v, row.tipo === 'ENTRADA' ? '+' : '-'),
        },
      ],
    }
  },

  computed: {
    primeiroDia() {
      return new Date(this.ano, this.mes - 1, 1)
    },

    nomeMes() {
      return date.formatDate(this.primeiroDia, 'MMMM [de] YYYY')
    },

    ehMesAtual() {
      const hoje = new Date()
      return this.mes === hoje.getMonth() + 1 && this.ano === hoje.getFullYear()
    },

    // Período do mês para a API (AAAA-MM-DD)
    periodo() {
      return {
        data_inicio: date.formatDate(this.primeiroDia, 'YYYY-MM-DD'),
        data_fim: date.formatDate(date.endOfDate(this.primeiroDia, 'month'), 'YYYY-MM-DD'),
      }
    },

    cartoes() {
      const s = this.saldo || {}
      return [
        {
          titulo: 'Saldo anterior',
          valor: dinheiro(s.saldo_anterior),
          cor: corSaldo(s.saldo_anterior),
        },
        { titulo: 'Entradas', valor: comSinal(s.entradas, '+'), cor: 'text-positive' },
        { titulo: 'Saídas', valor: comSinal(s.saidas, '-'), cor: 'text-negative' },
        { titulo: 'Saldo final', valor: dinheiro(s.saldo_final), cor: corSaldo(s.saldo_final) },
      ]
    },
  },

  mounted() {
    this.carregar()
  },

  methods: {
    mudarMes(quantos) {
      const novo = date.addToDate(this.primeiroDia, { months: quantos })
      this.mes = novo.getMonth() + 1
      this.ano = novo.getFullYear()
      this.carregar()
    },

    irParaMesAtual() {
      const hoje = new Date()
      this.mes = hoje.getMonth() + 1
      this.ano = hoje.getFullYear()
      this.carregar()
    },

    carregar() {
      this.carregarSaldo()
      this.carregarMovimentacao()
    },

    async carregarSaldo() {
      this.saldo = null
      try {
        const periodo = this.periodo
        const response = await FinanceiroService.saldo(periodo)
        // Cliques rápidos em ◀ ▶: ignora a resposta de um mês que já saiu da tela
        if (periodo.data_inicio !== this.periodo.data_inicio) return
        this.saldo = response.data.data
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      }
    },

    async carregarMovimentacao() {
      this.carregando = true
      try {
        const { periodo, tipo } = this
        const response = await FinanceiroService.movimentacao({
          ...periodo,
          tipo: tipo || undefined,
        })
        // Cliques rápidos em ◀ ▶ ou no filtro: ignora a resposta que já não vale para a tela
        if (periodo.data_inicio !== this.periodo.data_inicio || tipo !== this.tipo) return
        this.movimentos = response.data.data
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.carregando = false
      }
    },

    imprimir() {
      window.print()
    },
  },
})
</script>
