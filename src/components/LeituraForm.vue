<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="preencher"
  >
    <q-card v-if="apartamento" class="full-width">
      <q-card-section class="row items-center">
        <div class="text-h6">Leitura do apartamento {{ nomeApto(apartamento) }}</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>

      <q-form ref="form" @submit="enviar(false)">
        <q-card-section class="row q-col-gutter-md">
          <!-- Troca de relógio (40A): só quando a leitura anterior vem bloqueada.
               Na 1ª leitura do apartamento a anterior já é digitada. -->
          <div v-if="apartamento.leitura_anterior_bloqueada" class="col-12">
            <q-checkbox
              v-model="form.troca_relogio"
              label="Troca de relógio (a companhia instalou um relógio novo)"
              @update:model-value="trocarRelogio"
            />
          </div>

          <!-- Anterior: bloqueada com a última leitura finalizada; liberada na 1ª leitura
               do apartamento e na troca de relógio (fluxo do gás, seção 7 da API) -->
          <LeituraInput
            v-model="form.leitura_anterior"
            class="col-12 col-sm-6"
            label="Leitura anterior *"
            :hint="dicaAnterior"
            :disable="!anteriorLiberada"
            :autofocus="!apartamento.leitura_anterior_bloqueada"
            obrigatorio
          />
          <!-- O cursor começa no primeiro campo a digitar: a anterior na 1ª leitura, senão a atual -->
          <LeituraInput
            v-model="form.leitura_atual"
            class="col-12 col-sm-6"
            label="Leitura atual *"
            hint="Número que está no relógio hoje"
            :rules="[naoMenorQueAnterior]"
            :autofocus="apartamento.leitura_anterior_bloqueada"
            obrigatorio
          />

          <!-- Prévia ao vivo: o mesmo cálculo que o banco faz ao finalizar -->
          <div class="col-12">
            <q-banner rounded dense class="bg-grey-2">
              <template #avatar>
                <q-icon name="calculate" color="primary" />
              </template>
              <template v-if="consumo !== null && consumo >= 0">
                Consumo: <b>{{ m3(consumo) }} m³</b> × {{ dinheiro(despesa.valor_m3) }} =
                <b>{{ dinheiro(valor) }}</b>
              </template>
              <template v-else>Informe as leituras para ver o consumo e o valor.</template>
            </q-banner>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" />
          <q-btn type="submit" outline color="primary" label="Salvar" :loading="salvando" />
          <q-btn
            color="primary"
            icon="check"
            label="Salvar e finalizar"
            unelevated
            :loading="salvando"
            @click="enviar(true)"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'
import LeituraGasService from 'src/services/LeituraGasService'
import LeituraInput from 'src/components/LeituraInput.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { dataBr, dinheiro, m3, nomeApto } from 'src/utils/formatar'

export default defineComponent({
  name: 'LeituraForm',

  components: { LeituraInput },

  props: {
    modelValue: { type: Boolean, default: false },
    // Conta de gás do painel (id_despesa e valor_m3)
    despesa: { type: Object, default: null },
    // Apartamento do painel (com "leitura" e "ultima_leitura_finalizada")
    apartamento: { type: Object, default: null },
  },

  emits: ['update:modelValue', 'salvo'],

  data() {
    return {
      form: { troca_relogio: false, leitura_anterior: null, leitura_atual: null },
      salvando: false,
    }
  },

  computed: {
    ultima() {
      return this.apartamento?.ultima_leitura_finalizada
    },

    anteriorLiberada() {
      return !this.apartamento.leitura_anterior_bloqueada || this.form.troca_relogio
    },

    dicaAnterior() {
      if (this.form.troca_relogio) return 'Leitura inicial do relógio novo'
      if (!this.apartamento.leitura_anterior_bloqueada) {
        return 'Primeira leitura do apartamento: número que estava no relógio'
      }
      return `Última leitura finalizada, em ${dataBr(this.ultima.data_leitura)}`
    },

    // Conta em milésimos (inteiros), para não aparecer 4,999999 m³
    consumo() {
      const { leitura_anterior: anterior, leitura_atual: atual } = this.form
      if (anterior === null || atual === null) return null
      return (Math.round(atual * 1000) - Math.round(anterior * 1000)) / 1000
    },

    // Igual ao banco: ROUND(consumo × valor_m3, 2)
    valor() {
      return Math.round(this.consumo * this.despesa.valor_m3 * 100) / 100
    },
  },

  methods: {
    dinheiro,
    m3,
    nomeApto,

    preencher() {
      const leitura = this.apartamento.leitura
      // Leitura anterior: a digitada (1ª leitura ou troca) ou a última finalizada
      const anterior =
        leitura && (leitura.troca_relogio || !this.apartamento.leitura_anterior_bloqueada)
          ? leitura.leitura_anterior
          : (this.ultima?.leitura_atual ?? null)
      this.form = {
        troca_relogio: leitura?.troca_relogio || false,
        leitura_anterior: anterior,
        leitura_atual: leitura?.leitura_atual ?? null,
      }
    },

    // Marcou: esvazia para digitar a leitura do relógio novo. Desmarcou: volta a última finalizada.
    trocarRelogio(marcado) {
      this.form.leitura_anterior = marcado ? null : this.ultima.leitura_atual
    },

    naoMenorQueAnterior() {
      return (
        this.consumo === null ||
        this.consumo >= 0 ||
        'A leitura atual não pode ser menor que a anterior'
      )
    },

    async enviar(finalizar) {
      if (!(await this.$refs.form.validate())) return
      if (!finalizar) return this.gravar(false)

      // 39A: finalizar não tem volta, então confirma mostrando o resultado
      this.$q
        .dialog({
          title: 'Finalizar leitura',
          message:
            `Apartamento ${nomeApto(this.apartamento)}: consumo de ${m3(this.consumo)} m³ = ` +
            `${dinheiro(this.valor)}. Depois de finalizada, a leitura não pode mais ser alterada. Confirma?`,
          cancel: { flat: true, label: 'Voltar' },
          ok: { color: 'primary', unelevated: true, label: 'Finalizar' },
          persistent: true,
        })
        .onOk(() => this.gravar(true))
    },

    async gravar(finalizar) {
      const dados = {
        leitura_atual: this.form.leitura_atual,
        // Bloqueada, a API usa a última finalizada (não precisa enviar)
        leitura_anterior: this.anteriorLiberada ? this.form.leitura_anterior : null,
        troca_relogio: this.form.troca_relogio,
      }

      this.salvando = true
      let salvou = false
      try {
        let response = this.apartamento.leitura
          ? await LeituraGasService.alterar(this.apartamento.leitura.id_leitura_gas, dados)
          : await LeituraGasService.criar({
              id_despesa: this.despesa.id_despesa,
              id_apartamento: this.apartamento.id_apartamento,
              ...dados,
            })
        salvou = true

        if (finalizar) {
          response = await LeituraGasService.finalizar(response.data.data.id_leitura_gas)
          this.$q.notify({
            type: 'positive',
            message: `Leitura do apartamento ${nomeApto(this.apartamento)} finalizada: ${dinheiro(response.data.data.valor)}.`,
          })
        } else {
          this.$q.notify({ type: 'positive', message: 'Leitura salva. Falta finalizar.' })
        }
        this.$emit('salvo')
        this.$emit('update:modelValue', false)
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
        // Salvou, mas não finalizou: atualiza a tela (a leitura já existe, em andamento)
        if (salvou) {
          this.$emit('salvo')
          this.$emit('update:modelValue', false)
        }
      } finally {
        this.salvando = false
      }
    },
  },
})
</script>
