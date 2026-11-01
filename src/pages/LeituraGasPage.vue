<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5">Leitura de gás</div>
    </div>

    <!-- Por mês, como em Despesas; abre no mês da conta de gás mais recente (35A) -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="chevron_left" @click="mudarMes(-1)">
        <q-tooltip>Mês anterior</q-tooltip>
      </q-btn>
      <div class="text-h6 q-mx-sm">{{ nomeMes }}</div>
      <q-btn flat round icon="chevron_right" @click="mudarMes(1)">
        <q-tooltip>Próximo mês</q-tooltip>
      </q-btn>
      <q-btn
        v-if="maisRecente && !ehMaisRecente"
        flat
        dense
        no-caps
        color="primary"
        label="Mês mais recente"
        @click="irParaMaisRecente"
      />
    </div>

    <div v-if="carregando" class="row justify-center q-pa-lg">
      <q-spinner color="primary" size="lg" />
    </div>

    <!-- Mês sem conta de gás (36A): o ADMIN cadastra ali mesmo -->
    <q-card v-else-if="contasDoMes.length === 0" flat bordered>
      <q-card-section class="text-center q-pa-lg">
        <q-icon name="local_fire_department" size="48px" color="grey-5" />
        <div class="text-subtitle1 q-mt-sm">
          Nenhuma conta de gás cadastrada em {{ nomeMesMinusculo }}.
        </div>
        <template v-if="isAdmin">
          <div class="text-grey-7">
            Cadastre a conta (valor e preço do m³) para lançar as leituras.
          </div>
          <q-btn
            class="q-mt-md"
            color="primary"
            icon="add"
            label="Cadastrar conta de gás"
            unelevated
            @click="despesaFormAberto = true"
          />
        </template>
      </q-card-section>
    </q-card>

    <template v-else-if="painel">
      <!-- Raro: mais de uma conta de gás no mesmo mês -->
      <q-btn-toggle
        v-if="contasDoMes.length > 1"
        v-model="idDespesa"
        class="q-mb-md"
        :options="contasDoMes.map((c) => ({ label: c.descricao, value: c.id_despesa }))"
        no-caps
        unelevated
        toggle-color="primary"
        @update:model-value="carregarPainel"
      />

      <!-- Resumo e progresso (37A): mostra quanto do trabalho já foi feito -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">{{ painel.descricao }} — valor da conta</div>
            <div class="text-h6">{{ dinheiro(painel.valor_conta) }}</div>
          </div>
          <div class="col-6 col-sm-4">
            <div class="text-caption text-grey-7">Preço do m³</div>
            <div class="text-h6">{{ dinheiro(painel.valor_m3) }}</div>
          </div>
          <div class="col-6 col-sm-4">
            <div class="text-caption text-grey-7">Cobrado dos apartamentos</div>
            <div class="text-h6">{{ dinheiro(painel.total_consumo) }}</div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row items-center q-mb-xs">
            <div>
              {{ painel.total_finalizadas }} de {{ painel.total_apartamentos }} apartamentos
              finalizados
            </div>
            <q-space />
            <q-badge v-if="painel.completa" color="positive">Leituras concluídas</q-badge>
          </div>
          <q-linear-progress
            :value="progresso"
            :color="painel.completa ? 'positive' : 'primary'"
            size="10px"
            rounded
          />
        </q-card-section>
      </q-card>

      <!-- Diferença entre a conta e o consumo (44A, decisão 8B da API): só no mês completo -->
      <q-banner
        v-if="painel.completa && painel.diferenca !== 0"
        rounded
        class="bg-orange-1 q-mb-md"
      >
        <template #avatar>
          <q-icon name="warning" color="warning" />
        </template>
        O consumo dos apartamentos soma {{ dinheiro(painel.total_consumo) }} e a conta é de
        {{ dinheiro(painel.valor_conta) }}.
        <template v-if="painel.diferenca > 0">
          A diferença de {{ dinheiro(painel.diferenca) }} não é cobrada nas faturas.
        </template>
        <!-- Consumo maior que a conta: os apartamentos pagam a mais (cada um paga o que consumiu) -->
        <template v-else>
          As faturas vão cobrar {{ dinheiro(-painel.diferenca) }} a mais do que a conta. Confira as
          leituras e o preço do m³.
        </template>
      </q-banner>

      <q-banner v-if="painel.total_apartamentos === 0" rounded class="bg-grey-2">
        Nenhum apartamento ativo cadastrado até o fim de {{ nomeMesMinusculo }}.
      </q-banner>

      <!-- Apartamentos em ordem; o próximo da fila fica destacado (um por vez) -->
      <q-list v-else bordered separator class="bg-white rounded-borders">
        <q-item
          v-for="a in painel.apartamentos"
          :key="a.id_apartamento"
          :class="{ 'bg-blue-1': ehProximo(a) }"
        >
          <q-item-section avatar>
            <q-icon :name="SITUACOES[a.situacao].icone" :color="SITUACOES[a.situacao].cor" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-subtitle1">Apartamento {{ nomeApto(a) }}</q-item-label>
            <q-item-label caption>{{ resumo(a) }}</q-item-label>
            <q-item-label v-if="a.leitura?.troca_relogio" caption>
              <q-icon name="swap_horiz" /> Troca de relógio
            </q-item-label>
            <!-- Consulta não vê botões (45A) -->
            <div v-if="isAdmin && ehProximo(a)" class="q-mt-sm">
              <q-btn
                color="primary"
                unelevated
                :icon="a.leitura ? 'fact_check' : 'edit'"
                :label="a.leitura ? 'Conferir e finalizar' : 'Lançar leitura'"
                @click="abrirLeitura(a)"
              />
            </div>
          </q-item-section>

          <q-item-section side top>
            <q-badge :color="SITUACOES[a.situacao].cor">{{ SITUACOES[a.situacao].label }}</q-badge>
            <q-item-label v-if="a.situacao === 'FINALIZADA'" class="text-weight-bold q-mt-xs">
              {{ dinheiro(a.leitura.valor) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <LeituraForm
      v-model="leituraAberta"
      :despesa="painel"
      :apartamento="apartamento"
      @salvo="carregarPainel"
    />

    <DespesaForm
      v-model="despesaFormAberto"
      :data-padrao="dataPadrao"
      tipo-padrao="GAS"
      @salvo="contaCadastrada"
    />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { date } from 'quasar'
import { mapState } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import DespesaService from 'src/services/DespesaService'
import LeituraGasService from 'src/services/LeituraGasService'
import LeituraForm from 'src/components/LeituraForm.vue'
import DespesaForm from 'src/components/DespesaForm.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { dataBr, dinheiro, m3, nomeApto } from 'src/utils/formatar'

// Situação de cada apartamento (vem do painel da API), sempre com a mesma cor e ícone
const SITUACOES = {
  PENDENTE: { label: 'Pendente', cor: 'grey', icone: 'schedule' },
  EM_ANDAMENTO: { label: 'Em andamento', cor: 'orange', icone: 'edit_note' },
  FINALIZADA: { label: 'Finalizada', cor: 'positive', icone: 'check_circle' },
}

// 2026 e 10 → '2026-10' (início da data_referencia das contas daquele mês)
const anoMes = (ano, mes) => `${ano}-${String(mes).padStart(2, '0')}`

export default defineComponent({
  name: 'LeituraGasPage',

  components: { LeituraForm, DespesaForm },

  data() {
    const hoje = new Date()
    return {
      SITUACOES,
      mes: hoje.getMonth() + 1,
      ano: hoje.getFullYear(),
      // Todas as contas de gás ativas (uma por mês, normalmente), da mais recente para a mais antiga
      contas: [],
      idDespesa: null,
      painel: null,
      // Começa carregando, para não piscar "Nenhuma conta de gás" antes da resposta
      carregando: true,
      leituraAberta: false,
      apartamento: null,
      despesaFormAberto: false,
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

    // No meio da frase o mês vai em minúsculas: "cadastrada em setembro de 2026"
    nomeMesMinusculo() {
      return this.nomeMes.toLowerCase()
    },

    contasDoMes() {
      return this.contas.filter((c) => c.data_referencia.startsWith(anoMes(this.ano, this.mes)))
    },

    maisRecente() {
      return this.contas[0] || null
    },

    ehMaisRecente() {
      return this.maisRecente.data_referencia.startsWith(anoMes(this.ano, this.mes))
    },

    progresso() {
      return this.painel.total_apartamentos
        ? this.painel.total_finalizadas / this.painel.total_apartamentos
        : 0
    },

    // Conta de gás nova: sugere o último dia do mês aberto (36A)
    dataPadrao() {
      return date.formatDate(date.endOfDate(this.primeiroDia, 'month'), 'YYYY-MM-DD')
    },

    // 42A: mês começado e não terminado (só importa para quem lança, o ADMIN)
    leituraIncompleta() {
      return (
        this.isAdmin &&
        !!this.painel &&
        !this.painel.completa &&
        this.painel.apartamentos.some((a) => a.situacao !== 'PENDENTE')
      )
    },
  },

  async mounted() {
    window.addEventListener('beforeunload', this.avisarAoFechar)
    await this.carregarContas()
    if (this.maisRecente) this.irParaMaisRecente()
    else this.carregarMes()
  },

  beforeUnmount() {
    window.removeEventListener('beforeunload', this.avisarAoFechar)
  },

  // 42A: ao sair da tela com o mês incompleto, avisa e deixa escolher (não prende o usuário).
  // As leituras já lançadas continuam salvas; ao voltar, a tela segue do próximo apartamento.
  beforeRouteLeave() {
    if (!this.leituraIncompleta) return true
    return new Promise((resolve) => {
      this.$q
        .dialog({
          title: 'Leituras não terminadas',
          message:
            `As leituras de ${this.nomeMesMinusculo} não terminaram ` +
            `(${this.painel.total_finalizadas} de ${this.painel.total_apartamentos} finalizados). ` +
            'As leituras lançadas ficam salvas. Sair mesmo assim?',
          cancel: { flat: true, label: 'Continuar lendo' },
          ok: { color: 'primary', flat: true, label: 'Sair' },
          persistent: true,
        })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false))
    })
  },

  methods: {
    dinheiro,
    nomeApto,

    // Fechar ou atualizar a aba: o navegador mostra o aviso padrão dele
    avisarAoFechar(evento) {
      if (this.leituraIncompleta) {
        evento.preventDefault()
        evento.returnValue = ''
      }
    },

    // A conta de gás é a despesa VARIAVEL com o preço do m³
    async carregarContas() {
      try {
        const response = await DespesaService.listar({ tipo_despesa: 'VARIAVEL', ativo: true })
        this.contas = response.data.data.filter((d) => d.valor_m3 !== null)
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      }
    },

    mudarMes(quantos) {
      const novo = date.addToDate(this.primeiroDia, { months: quantos })
      this.mes = novo.getMonth() + 1
      this.ano = novo.getFullYear()
      this.carregarMes()
    },

    irParaMaisRecente() {
      const [ano, mes] = this.maisRecente.data_referencia.split('-')
      this.ano = Number(ano)
      this.mes = Number(mes)
      this.carregarMes()
    },

    carregarMes() {
      this.painel = null
      this.idDespesa = this.contasDoMes[0]?.id_despesa || null
      if (this.idDespesa) this.carregarPainel()
      else this.carregando = false
    },

    async carregarPainel() {
      this.carregando = true
      try {
        const response = await LeituraGasService.painel(this.idDespesa)
        this.painel = response.data.data
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.carregando = false
      }
    },

    async contaCadastrada() {
      await this.carregarContas()
      this.carregarMes()
    },

    ehProximo(apto) {
      return this.painel.proximo_apartamento?.id_apartamento === apto.id_apartamento
    },

    resumo(apto) {
      const l = apto.leitura
      if (l) {
        const texto = `Leitura: ${m3(l.leitura_anterior)} → ${m3(l.leitura_atual)} · consumo ${m3(l.consumo)} m³`
        return l.finalizada
          ? `${texto} · em ${dataBr(l.data_leitura)}`
          : `${texto} · falta finalizar`
      }
      const ultima = apto.ultima_leitura_finalizada
      return ultima
        ? `Última leitura: ${m3(ultima.leitura_atual)} (${dataBr(ultima.data_leitura)})`
        : 'Primeira leitura do apartamento'
    },

    abrirLeitura(apto) {
      this.apartamento = apto
      this.leituraAberta = true
    },
  },
})
</script>
