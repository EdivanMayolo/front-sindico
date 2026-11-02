<template>
  <q-page padding>
    <!-- Mesmo formato das outras telas: título, botão Novo, busca e tabela -->
    <div class="row items-center q-mb-md">
      <div class="text-h5">Despesas</div>
      <q-space />
      <q-btn
        v-if="isAdmin"
        color="primary"
        icon="add"
        label="Nova despesa"
        unelevated
        @click="abrirForm(null)"
      />
    </div>

    <!-- A lista é por mês de referência (26A), com o total do mês (32A) -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="chevron_left" @click="mudarMes(-1)">
        <q-tooltip>Mês anterior</q-tooltip>
      </q-btn>
      <div class="text-h6 q-mx-sm">{{ nomeMes }}</div>
      <q-btn flat round icon="chevron_right" @click="mudarMes(1)">
        <q-tooltip>Próximo mês</q-tooltip>
      </q-btn>
      <q-btn
        v-if="!ehMesAtual"
        flat
        dense
        no-caps
        color="primary"
        label="Mês atual"
        @click="irParaMesAtual"
      />
      <q-space />
      <div class="text-subtitle1">
        Total do mês: <span class="text-weight-bold">{{ dinheiro(totalMes) }}</span>
      </div>
    </div>

    <q-table
      :rows="despesas"
      :columns="colunas"
      row-key="id_despesa"
      :filter="busca"
      :loading="carregando"
      :grid="$q.screen.xs"
      flat
      bordered
      no-data-label="Nenhuma despesa neste mês."
      no-results-label="Nenhuma despesa encontrada."
      :rows-per-page-options="[10, 25, 50, 0]"
      @row-click="(evt, row) => abrirDetalhe(row)"
    >
      <template #top>
        <q-input v-model="busca" class="col-12 col-sm-6" dense outlined placeholder="Buscar">
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template #body-cell-descricao="props">
        <q-td :props="props">
          {{ props.row.descricao }}
          <q-badge v-if="!props.row.ativo" color="grey" class="q-ml-sm">Inativa</q-badge>
        </q-td>
      </template>

      <template #body-cell-tipo="props">
        <q-td :props="props">
          <q-badge :color="corTipo(props.row)">{{ tipoDespesa(props.row) }}</q-badge>
        </q-td>
      </template>
    </q-table>

    <!-- Detalhe da despesa (29A): dados + prévia do rateio -->
    <q-dialog v-model="detalheAberto">
      <q-card v-if="despesa" class="full-width">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ despesa.descricao }}</div>
          <q-space />
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list dense>
            <q-item>
              <q-item-section avatar><q-icon name="category" /></q-item-section>
              <q-item-section>
                <q-item-label>
                  <q-badge :color="corTipo(despesa)">{{ tipoDespesa(despesa) }}</q-badge>
                  <q-badge v-if="!despesa.ativo" color="grey" class="q-ml-sm">Inativa</q-badge>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="payments" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ dinheiro(despesa.valor_total) }}</q-item-label>
                <q-item-label v-if="despesa.valor_m3" caption>
                  Preço do m³: {{ dinheiro(despesa.valor_m3) }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="event" /></q-item-section>
              <q-item-section>
                <q-item-label>Referência: {{ dataBr(despesa.data_referencia) }}</q-item-label>
                <q-item-label caption>
                  Cobrada na fatura de {{ mesAno(despesa.mes_cobranca, despesa.ano_cobranca) }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="despesa.observacao">
              <q-item-section avatar><q-icon name="notes" /></q-item-section>
              <q-item-section>{{ despesa.observacao }}</q-item-section>
            </q-item>
            <q-item v-if="despesa.em_uso">
              <q-item-section avatar><q-icon name="lock" color="warning" /></q-item-section>
              <q-item-section class="text-grey-8">
                Já lançada em fatura ou com leituras de gás: só a descrição e a observação podem ser
                alteradas.
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">Rateio</div>
          <div v-if="despesa.valor_m3" class="text-grey-7">
            Cobrada pelo consumo de cada apartamento (Leitura de gás).
          </div>
          <div v-else-if="carregandoRateio" class="row justify-center">
            <q-spinner color="primary" size="md" />
          </div>
          <!-- A API explica por que não há rateio (ex.: nenhum apartamento no mês) -->
          <div v-else-if="erroRateio" class="text-grey-7">{{ erroRateio }}</div>
          <template v-else-if="rateio">
            <!-- Já faturada: o texto não pode dizer que "vai entrar" (os valores estão nas faturas) -->
            <div v-if="despesa.em_uso" class="text-caption text-grey-7 q-mb-sm">
              Divisão igual entre os {{ rateio.quantidade_apartamentos }} apartamentos, já lançada
              nas faturas. Os valores de cada apartamento estão em Faturas.
            </div>
            <div v-else class="text-caption text-grey-7 q-mb-sm">
              Prévia: divisão igual entre os {{ rateio.quantidade_apartamentos }} apartamentos. Os
              valores entram na fatura de {{ mesAno(rateio.mes_cobranca, rateio.ano_cobranca) }}.
            </div>
            <q-list bordered separator dense>
              <q-item v-for="a in rateio.apartamentos" :key="a.id_apartamento">
                <q-item-section>Apartamento {{ nomeApto(a) }}</q-item-section>
                <q-item-section side>{{ dinheiro(a.valor) }}</q-item-section>
              </q-item>
            </q-list>
          </template>
        </q-card-section>

        <q-card-actions v-if="isAdmin" align="right">
          <q-btn
            flat
            color="negative"
            icon="delete"
            label="Excluir"
            :disable="despesa.em_uso"
            @click="excluir"
          >
            <q-tooltip v-if="despesa.em_uso">Despesa já lançada: não pode ser excluída</q-tooltip>
          </q-btn>
          <q-btn
            unelevated
            color="primary"
            icon="edit"
            label="Editar"
            @click="abrirForm(despesa)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <DespesaForm
      v-model="formAberto"
      :despesa="despesaEditada"
      :data-padrao="dataPadrao"
      @salvo="salvo"
    />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { date } from 'quasar'
import { mapState } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import DespesaService from 'src/services/DespesaService'
import DespesaForm from 'src/components/DespesaForm.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { dataBr, dinheiro, mesAno, nomeApto, tipoDespesa } from 'src/utils/formatar'

// Mesma cor para o mesmo tipo em todas as telas (consistência)
const CORES_TIPO = { Fixa: 'primary', Variável: 'teal', Gás: 'orange', Outros: 'grey-7' }

export default defineComponent({
  name: 'DespesasPage',

  components: { DespesaForm },

  data() {
    const hoje = new Date()
    return {
      despesas: [],
      mes: hoje.getMonth() + 1,
      ano: hoje.getFullYear(),
      busca: '',
      carregando: false,
      detalheAberto: false,
      despesa: null,
      rateio: null,
      erroRateio: '',
      carregandoRateio: false,
      formAberto: false,
      despesaEditada: null,
      // Só as colunas essenciais; o resto fica no detalhe
      colunas: [
        // O "format" é o texto do modo cartão (celular); na tabela aparecem os selos
        {
          name: 'descricao',
          label: 'Descrição',
          field: 'descricao',
          align: 'left',
          sortable: true,
          format: (v, row) => (row.ativo ? v : `${v} (inativa)`),
        },
        {
          name: 'tipo',
          label: 'Tipo',
          field: (row) => tipoDespesa(row),
          align: 'left',
          sortable: true,
        },
        {
          name: 'data',
          label: 'Data',
          field: 'data_referencia',
          align: 'left',
          sortable: true,
          format: dataBr,
        },
        {
          name: 'valor',
          label: 'Valor',
          field: 'valor_total',
          align: 'right',
          sortable: true,
          format: dinheiro,
        },
        {
          name: 'cobranca',
          label: 'Cobrança',
          field: (row) => mesAno(row.mes_cobranca, row.ano_cobranca),
          align: 'center',
        },
      ],
    }
  },

  computed: {
    ...mapState(useAuthStore, ['isAdmin']),

    primeiroDia() {
      return new Date(this.ano, this.mes - 1, 1)
    },

    // "Outubro de 2026" (nomes dos meses em português, do idioma do Quasar)
    nomeMes() {
      return date.formatDate(this.primeiroDia, 'MMMM [de] YYYY')
    },

    ehMesAtual() {
      const hoje = new Date()
      return this.mes === hoje.getMonth() + 1 && this.ano === hoje.getFullYear()
    },

    // Despesa inativa não entra no saldo, então também não entra no total.
    // Soma em centavos para não aparecer 0,30000000004.
    totalMes() {
      const centavos = this.despesas
        .filter((d) => d.ativo)
        .reduce((soma, d) => soma + Math.round(d.valor_total * 100), 0)
      return centavos / 100
    },

    // Nova despesa: sugere hoje no mês atual; nos outros meses, o último dia do mês aberto
    dataPadrao() {
      const dia = this.ehMesAtual ? new Date() : date.endOfDate(this.primeiroDia, 'month')
      return date.formatDate(dia, 'YYYY-MM-DD')
    },
  },

  mounted() {
    this.carregar()
  },

  methods: {
    dataBr,
    dinheiro,
    mesAno,
    nomeApto,
    tipoDespesa,

    corTipo(despesa) {
      return CORES_TIPO[tipoDespesa(despesa)]
    },

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

    async carregar() {
      this.carregando = true
      try {
        const { mes, ano } = this
        const response = await DespesaService.listar({ mes, ano })
        // Cliques rápidos em ◀ ▶: ignora a resposta de um mês que já saiu da tela
        if (mes !== this.mes || ano !== this.ano) return
        this.despesas = response.data.data
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.carregando = false
      }
    },

    async abrirDetalhe(row) {
      try {
        const response = await DespesaService.buscarPorId(row.id_despesa)
        this.despesa = response.data.data
        this.detalheAberto = true
        this.carregarRateio()
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      }
    },

    // A conta de gás não tem rateio: cada apartamento paga o consumo
    async carregarRateio() {
      this.rateio = null
      this.erroRateio = ''
      if (this.despesa.valor_m3) return

      this.carregandoRateio = true
      try {
        const response = await DespesaService.rateio(this.despesa.id_despesa)
        this.rateio = response.data.data
      } catch (err) {
        this.erroRateio = mensagemErro(err)
      } finally {
        this.carregandoRateio = false
      }
    },

    abrirForm(despesa) {
      this.despesaEditada = despesa
      this.formAberto = true
    },

    salvo() {
      this.detalheAberto = false
      this.carregar()
    },

    excluir() {
      this.$q
        .dialog({
          title: 'Excluir despesa',
          message: `Excluir a despesa "${this.despesa.descricao}" de ${dinheiro(this.despesa.valor_total)}?`,
          cancel: { flat: true, label: 'Cancelar' },
          ok: { color: 'negative', unelevated: true, label: 'Excluir' },
          persistent: true,
        })
        .onOk(async () => {
          try {
            // A API diz se excluiu ou só inativou (despesa em faturas canceladas)
            const response = await DespesaService.excluir(this.despesa.id_despesa)
            this.$q.notify({ type: 'positive', message: response.data.message })
            this.detalheAberto = false
            this.carregar()
          } catch (err) {
            this.$q.notify({ type: 'negative', message: mensagemErro(err) })
          }
        })
    },
  },
})
</script>
