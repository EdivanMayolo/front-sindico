<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="preencher"
  >
    <q-card class="full-width">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ despesa ? 'Editar despesa' : 'Nova despesa' }}</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>

      <q-form @submit="salvar">
        <q-card-section class="row q-col-gutter-md">
          <!-- Já lançada em fatura (30A): só descrição e observação podem mudar -->
          <div v-if="emUso" class="col-12">
            <q-banner rounded dense class="bg-orange-1">
              <template #avatar>
                <q-icon name="lock" color="warning" />
              </template>
              Despesa já lançada em fatura ou com leituras de gás: só a descrição e a observação
              podem ser alteradas.
            </q-banner>
          </div>

          <q-input
            v-model="form.descricao"
            class="col-12"
            label="Descrição *"
            placeholder="Ex.: Energia elétrica - áreas comuns"
            maxlength="150"
            outlined
            autofocus
            lazy-rules
            :rules="[(v) => !!(v && v.trim()) || 'Informe a descrição']"
          />

          <div class="col-12">
            <div class="text-subtitle2">Tipo</div>
            <q-option-group
              v-model="form.tipo"
              :options="TIPOS"
              :disable="emUso"
              color="primary"
              inline
            />
            <div v-if="form.tipo === 'GAS'" class="text-caption text-grey-7">
              A conta de gás não é dividida igual: cada apartamento paga o próprio consumo (Leitura
              de gás).
            </div>
          </div>

          <ValorInput
            v-model="form.valor_total"
            class="col-12 col-sm-6"
            :label="form.tipo === 'GAS' ? 'Valor da conta *' : 'Valor total *'"
            :disable="emUso"
            obrigatorio
          />
          <ValorInput
            v-if="form.tipo === 'GAS'"
            v-model="form.valor_m3"
            class="col-12 col-sm-6"
            label="Preço do m³ *"
            hint="Usado no cálculo de cada leitura"
            :disable="emUso"
            obrigatorio
          />

          <DataInput
            v-model="form.data_referencia"
            class="col-12 col-sm-6"
            label="Data de referência *"
            :hint="dicaCobranca"
            :disable="emUso"
            obrigatorio
          />

          <q-input
            v-model="form.observacao"
            class="col-12"
            type="textarea"
            label="Observação"
            hint="Opcional"
            autogrow
            outlined
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" />
          <q-btn type="submit" color="primary" label="Salvar" unelevated :loading="salvando" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'
import { date } from 'quasar'
import DespesaService from 'src/services/DespesaService'
import ValorInput from 'src/components/ValorInput.vue'
import DataInput from 'src/components/DataInput.vue'
import mensagemErro from 'src/utils/mensagemErro'

// "Gás" não existe no banco (27A): é uma despesa VARIAVEL com o preço do m³
const TIPOS = [
  { label: 'Fixa', value: 'FIXA' },
  { label: 'Variável', value: 'VARIAVEL' },
  { label: 'Gás', value: 'GAS' },
  { label: 'Outros', value: 'OUTROS' },
]

export default defineComponent({
  name: 'DespesaForm',

  components: { ValorInput, DataInput },

  props: {
    modelValue: { type: Boolean, default: false },
    // Despesa a editar; vazio = cadastro novo
    despesa: { type: Object, default: null },
    // Data sugerida no cadastro novo (o mês que está aberto na tela)
    dataPadrao: { type: String, default: null },
    // Tipo já marcado no cadastro novo (a tela de Leitura de gás abre com 'GAS')
    tipoPadrao: { type: String, default: 'FIXA' },
  },

  emits: ['update:modelValue', 'salvo'],

  data() {
    return {
      TIPOS,
      form: {},
      salvando: false,
    }
  },

  computed: {
    emUso() {
      return !!this.despesa?.em_uso
    },

    // Mostra na hora em qual fatura a despesa vai entrar (mês seguinte — decisão 3B da API)
    dicaCobranca() {
      if (!this.form.data_referencia) return 'A despesa é cobrada na fatura do mês seguinte'
      const cobranca = date.addToDate(`${this.form.data_referencia.slice(0, 7)}-01T00:00:00`, {
        months: 1,
      })
      return `Será cobrada na fatura de ${date.formatDate(cobranca, 'MM/YYYY')}`
    },
  },

  methods: {
    preencher() {
      const d = this.despesa || {}
      this.form = {
        descricao: d.descricao || '',
        tipo: d.valor_m3 ? 'GAS' : d.tipo_despesa || this.tipoPadrao,
        valor_total: d.valor_total ?? null,
        valor_m3: d.valor_m3 ?? null,
        data_referencia: d.data_referencia || this.dataPadrao,
        observacao: d.observacao || '',
      }
    },

    async salvar() {
      const gas = this.form.tipo === 'GAS'
      const dados = {
        descricao: this.form.descricao,
        tipo_despesa: gas ? 'VARIAVEL' : this.form.tipo,
        valor_total: this.form.valor_total,
        valor_m3: gas ? this.form.valor_m3 : null,
        data_referencia: this.form.data_referencia,
        observacao: this.form.observacao,
      }

      this.salvando = true
      try {
        const response = this.despesa
          ? await DespesaService.alterar(this.despesa.id_despesa, dados)
          : await DespesaService.criar(dados)
        this.$q.notify({ type: 'positive', message: 'Despesa salva.' })
        this.$emit('salvo', response.data.data)
        this.$emit('update:modelValue', false)
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.salvando = false
      }
    },
  },
})
</script>
