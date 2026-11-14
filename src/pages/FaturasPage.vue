<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5">Faturas</div>
    </div>

    <!-- Por mês de referência (47A): abre no último mês fechado, que é o mês a gerar ou conferir -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="chevron_left" @click="mudarMes(-1)">
        <q-tooltip>Mês anterior</q-tooltip>
      </q-btn>
      <div class="q-mx-sm">
        <div class="text-h6">{{ nomeMes }}</div>
        <!-- 48A: o mês dos gastos e o mês em que a fatura é cobrada -->
        <div class="text-caption text-grey-7">
          Referente a {{ mesAno(mes, ano) }} · cobrança em {{ mesCobranca(mes, ano) }}
        </div>
      </div>
      <q-btn flat round icon="chevron_right" @click="mudarMes(1)">
        <q-tooltip>Próximo mês</q-tooltip>
      </q-btn>
      <q-btn
        v-if="!ehUltimoFechado"
        flat
        dense
        no-caps
        color="primary"
        label="Último mês fechado"
        @click="irParaUltimoFechado"
      />
      <q-space />
      <div v-if="gerado" class="text-subtitle1">
        Total do mês: <span class="text-weight-bold">{{ dinheiro(totalMes) }}</span>
      </div>
    </div>

    <div v-if="carregando" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="lg" />
    </div>

    <!-- Mês ainda não gerado (49A / 50A) -->
    <q-card v-else-if="!gerado" flat bordered>
      <q-card-section class="column items-center text-center q-pa-lg">
        <q-icon name="request_quote" size="xl" color="grey-5" />
        <div class="text-subtitle1 q-mt-sm">
          As faturas de {{ nomeMesMinusculo }} ainda não foram geradas.
        </div>

        <template v-if="isAdmin">
          <div v-if="mesFechado" class="text-grey-7 q-mt-sm">
            Entram todas as despesas ainda não faturadas até {{ dataBr(fimDoMes) }}: as comuns
            divididas igualmente entre os apartamentos e o gás pelo consumo de cada um.
          </div>
          <div v-else class="text-grey-7 q-mt-sm">
            Liberado a partir de {{ dataBr(liberaEm) }}, depois que o mês terminar.
          </div>
          <q-btn
            class="q-mt-md"
            color="primary"
            icon="playlist_add_check"
            :label="`Gerar faturas de ${nomeMesMinusculo}`"
            unelevated
            :disable="!mesFechado"
            :loading="gerando"
            @click="gerar"
          />
        </template>
        <div v-else class="text-grey-7 q-mt-sm">
          Elas aparecem aqui quando o administrador gerar.
        </div>
      </q-card-section>
    </q-card>

    <!-- 51A: só as colunas essenciais, sem a situação (desativada: toda fatura fica aberta) -->
    <template v-else>
      <div class="text-caption text-grey-7 q-mb-sm">
        Geradas em {{ dataBr(faturas[0].data_geracao) }}. Clique na fatura para ver e imprimir.
      </div>
      <q-table
        :rows="faturas"
        :columns="colunas"
        row-key="id_fatura"
        :filter="busca"
        :grid="$q.screen.xs"
        flat
        bordered
        no-results-label="Nenhuma fatura encontrada."
        :rows-per-page-options="[10, 25, 50, 0]"
        @row-click="(evt, row) => abrir(row)"
      >
        <template #top>
          <q-input v-model="busca" class="col-12 col-sm-6" dense outlined placeholder="Buscar">
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
      </q-table>
    </template>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { date } from 'quasar'
import { mapState } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import FaturaService from 'src/services/FaturaService'
import mensagemErro from 'src/utils/mensagemErro'
import { dataBr, dinheiro, mesAno, mesCobranca, nomeApto } from 'src/utils/formatar'

// Último mês fechado = mês anterior ao atual
const ultimoFechado = () => date.addToDate(new Date(), { months: -1 })

export default defineComponent({
  name: 'FaturasPage',

  data() {
    // O mês fica no endereço (?mes=10&ano=2026): ao voltar do esboço, a tela abre no mesmo mês
    const { mes, ano } = this.$route.query
    const padrao = ultimoFechado()
    return {
      faturas: [],
      mes: Number(mes) || padrao.getMonth() + 1,
      ano: Number(ano) || padrao.getFullYear(),
      busca: '',
      carregando: true,
      gerando: false,
      colunas: [
        {
          name: 'apartamento',
          label: 'Apartamento',
          field: (row) => nomeApto(row),
          align: 'left',
          sortable: true,
        },
        { name: 'itens', label: 'Itens', field: 'quantidade_itens', align: 'center' },
        {
          name: 'total',
          label: 'Total',
          field: 'valor_total',
          align: 'right',
          sortable: true,
          format: dinheiro,
        },
      ],
    }
  },

  computed: {
    ...mapState(useAuthStore, ['isAdmin']),

    primeiroDia() {
      return new Date(this.ano, this.mes - 1, 1)
    },

    nomeMes() {
      return date.formatDate(this.primeiroDia, 'MMMM [de] YYYY')
    },

    // No meio da frase: "as faturas de outubro de 2026"
    nomeMesMinusculo() {
      return this.nomeMes.toLowerCase()
    },

    fimDoMes() {
      return date.formatDate(date.endOfDate(this.primeiroDia, 'month'), 'YYYY-MM-DD')
    },

    // A API só gera depois que o mês termina (1º dia do mês seguinte)
    liberaEm() {
      return date.formatDate(date.addToDate(this.primeiroDia, { months: 1 }), 'YYYY-MM-DD')
    },

    mesFechado() {
      return date.formatDate(new Date(), 'YYYY-MM-DD') >= this.liberaEm
    },

    ehUltimoFechado() {
      const padrao = ultimoFechado()
      return this.mes === padrao.getMonth() + 1 && this.ano === padrao.getFullYear()
    },

    gerado() {
      return this.faturas.length > 0
    },

    // Soma em centavos para não aparecer 0,30000000004
    totalMes() {
      const centavos = this.faturas.reduce((soma, f) => soma + Math.round(f.valor_total * 100), 0)
      return centavos / 100
    },
  },

  mounted() {
    this.carregar()
  },

  methods: {
    dataBr,
    dinheiro,
    mesAno,
    mesCobranca,
    nomeApto,

    mudarMes(quantos) {
      const novo = date.addToDate(this.primeiroDia, { months: quantos })
      this.irPara(novo.getMonth() + 1, novo.getFullYear())
    },

    irParaUltimoFechado() {
      const padrao = ultimoFechado()
      this.irPara(padrao.getMonth() + 1, padrao.getFullYear())
    },

    irPara(mes, ano) {
      this.mes = mes
      this.ano = ano
      this.$router.replace({ query: { mes, ano } })
      this.carregar()
    },

    async carregar() {
      this.carregando = true
      try {
        const { mes, ano } = this
        const response = await FaturaService.listar({ mes, ano })
        // Cliques rápidos em ◀ ▶: ignora a resposta de um mês que já saiu da tela
        if (mes !== this.mes || ano !== this.ano) return
        // Fatura cancelada não vale (o cancelamento está desativado, mas a API pode devolver)
        this.faturas = response.data.data.filter((f) => f.status !== 'CANCELADA')
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.carregando = false
      }
    },

    // 49A: a geração não tem volta (cancelar está desativado), então a confirmação explica
    gerar() {
      this.$q
        .dialog({
          title: 'Gerar faturas',
          message:
            `Gerar as faturas de ${this.nomeMesMinusculo} de todos os apartamentos? ` +
            `Entram as despesas ainda não faturadas até ${dataBr(this.fimDoMes)}. ` +
            `As despesas fixas do mês também serão lançadas em ${mesCobranca(this.mes, this.ano)}, ` +
            'com o mesmo valor. Depois de gerar, o mês não recebe novas despesas, e a geração não ' +
            'pode ser desfeita.',
          cancel: { flat: true, label: 'Cancelar' },
          ok: { color: 'primary', unelevated: true, label: 'Gerar faturas' },
          persistent: true,
        })
        .onOk(async () => {
          this.gerando = true
          try {
            const response = await FaturaService.gerar({ mes: this.mes, ano: this.ano })
            this.faturas = response.data.data
            this.$q.notify({
              type: 'positive',
              message:
                `${this.faturas.length} faturas de ${this.nomeMesMinusculo} geradas. ` +
                `As despesas fixas foram lançadas em ${mesCobranca(this.mes, this.ano)}.`,
            })
          } catch (err) {
            // Ex.: "Finalize as leituras de gás de 10/2026 antes de gerar as faturas"
            this.$q.notify({ type: 'negative', message: mensagemErro(err) })
          } finally {
            this.gerando = false
          }
        })
    },

    abrir(fatura) {
      this.$router.push(`/faturas/${fatura.id_fatura}`)
    },
  },
})
</script>
