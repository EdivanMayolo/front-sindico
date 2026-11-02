<template>
  <q-page padding>
    <!-- Mesmo formato da tela de Despesas (59A): título, botão Novo, mês, total e tabela -->
    <div class="row items-center q-mb-md">
      <div class="text-h5">Receitas</div>
      <q-space />
      <q-btn
        v-if="isAdmin"
        color="primary"
        icon="add"
        label="Nova receita"
        unelevated
        @click="abrirForm(null)"
      />
    </div>

    <!-- Por mês da data de recebimento -->
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
      :rows="receitas"
      :columns="colunas"
      row-key="id_receita"
      :filter="busca"
      :loading="carregando"
      :grid="$q.screen.xs"
      flat
      bordered
      no-data-label="Nenhuma receita neste mês."
      no-results-label="Nenhuma receita encontrada."
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
    </q-table>

    <!-- Detalhe da receita, com Editar e Excluir para o ADMIN -->
    <q-dialog v-model="detalheAberto">
      <q-card v-if="receita" class="full-width">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ receita.descricao }}</div>
          <q-space />
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list dense>
            <q-item>
              <q-item-section avatar><q-icon name="payments" /></q-item-section>
              <q-item-section>{{ dinheiro(receita.valor) }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="event" /></q-item-section>
              <q-item-section>Recebida em {{ dataBr(receita.data_recebimento) }}</q-item-section>
            </q-item>
            <q-item v-if="receita.observacao">
              <q-item-section avatar><q-icon name="notes" /></q-item-section>
              <q-item-section>{{ receita.observacao }}</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions v-if="isAdmin" align="right">
          <q-btn flat color="negative" icon="delete" label="Excluir" @click="excluir" />
          <q-btn
            unelevated
            color="primary"
            icon="edit"
            label="Editar"
            @click="abrirForm(receita)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ReceitaForm
      v-model="formAberto"
      :receita="receitaEditada"
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
import ReceitaService from 'src/services/ReceitaService'
import ReceitaForm from 'src/components/ReceitaForm.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { dataBr, dinheiro } from 'src/utils/formatar'

export default defineComponent({
  name: 'ReceitasPage',

  components: { ReceitaForm },

  data() {
    const hoje = new Date()
    return {
      receitas: [],
      mes: hoje.getMonth() + 1,
      ano: hoje.getFullYear(),
      busca: '',
      carregando: false,
      detalheAberto: false,
      receita: null,
      formAberto: false,
      receitaEditada: null,
      colunas: [
        {
          name: 'descricao',
          label: 'Descrição',
          field: 'descricao',
          align: 'left',
          sortable: true,
        },
        {
          name: 'data',
          label: 'Recebida em',
          field: 'data_recebimento',
          align: 'left',
          sortable: true,
          format: dataBr,
        },
        {
          name: 'valor',
          label: 'Valor',
          field: 'valor',
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

    ehMesAtual() {
      const hoje = new Date()
      return this.mes === hoje.getMonth() + 1 && this.ano === hoje.getFullYear()
    },

    // Soma em centavos para não aparecer 0,30000000004
    totalMes() {
      const centavos = this.receitas.reduce((soma, r) => soma + Math.round(r.valor * 100), 0)
      return centavos / 100
    },

    // Nova receita: sugere hoje no mês atual; nos outros meses, o último dia do mês aberto
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
        const response = await ReceitaService.listar({ mes, ano })
        // Cliques rápidos em ◀ ▶: ignora a resposta de um mês que já saiu da tela
        if (mes !== this.mes || ano !== this.ano) return
        this.receitas = response.data.data
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.carregando = false
      }
    },

    // A lista já traz todos os campos: não precisa buscar de novo
    abrirDetalhe(row) {
      this.receita = row
      this.detalheAberto = true
    },

    abrirForm(receita) {
      this.receitaEditada = receita
      this.formAberto = true
    },

    salvo() {
      this.detalheAberto = false
      this.carregar()
    },

    // 61A: exclui de verdade, com confirmação (o saldo se ajusta sozinho)
    excluir() {
      this.$q
        .dialog({
          title: 'Excluir receita',
          message: `Excluir a receita "${this.receita.descricao}" de ${dinheiro(this.receita.valor)}? O saldo do caixa vai diminuir.`,
          cancel: { flat: true, label: 'Cancelar' },
          ok: { color: 'negative', unelevated: true, label: 'Excluir' },
          persistent: true,
        })
        .onOk(async () => {
          try {
            const response = await ReceitaService.excluir(this.receita.id_receita)
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
