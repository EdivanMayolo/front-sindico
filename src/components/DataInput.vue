<template>
  <!-- Campo de data: o usuário vê e digita DD/MM/AAAA (ou escolhe no calendário);
       o v-model recebe AAAA-MM-DD, o formato da API -->
  <q-input
    :model-value="texto"
    :label="label"
    :hint="hint"
    mask="##/##/####"
    placeholder="DD/MM/AAAA"
    outlined
    lazy-rules
    :rules="[validar]"
    @update:model-value="alterar"
  >
    <template #append>
      <q-icon name="event" class="cursor-pointer">
        <q-tooltip>Escolher no calendário</q-tooltip>
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date
            :model-value="texto"
            mask="DD/MM/YYYY"
            :options="permitida"
            @update:model-value="alterar"
          >
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Fechar" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script>
import { defineComponent } from 'vue'
import { date } from 'quasar'
import { dataBr } from 'src/utils/formatar'

// "31/02/2026" não existe: a data só vale se ida e volta derem o mesmo texto
const dataValida = (texto) =>
  texto.length === 10 && date.formatDate(date.extractDate(texto, 'DD/MM/YYYY'), 'DD/MM/YYYY') === texto

export default defineComponent({
  name: 'DataInput',

  props: {
    modelValue: { type: String, default: null },
    label: { type: String, default: 'Data' },
    hint: { type: String, default: '' },
    obrigatorio: { type: Boolean, default: false },
    // Data mínima (AAAA-MM-DD), opcional: as anteriores ficam desabilitadas no calendário
    minimo: { type: String, default: null },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      texto: dataBr(this.modelValue),
    }
  },

  watch: {
    modelValue(valor) {
      if (valor !== this.iso(this.texto)) this.texto = dataBr(valor)
    },
  },

  methods: {
    iso(texto) {
      return texto && dataValida(texto)
        ? date.formatDate(date.extractDate(texto, 'DD/MM/YYYY'), 'YYYY-MM-DD')
        : null
    },

    alterar(texto) {
      this.texto = texto || ''
      this.$emit('update:modelValue', this.iso(this.texto))
    },

    // O q-date passa a data como AAAA/MM/DD
    permitida(dia) {
      return !this.minimo || dia >= this.minimo.replaceAll('-', '/')
    },

    validar(texto) {
      if (!texto) return !this.obrigatorio || 'Informe a data'
      if (!dataValida(texto)) return 'Data inválida'
      return (
        !this.minimo || this.iso(texto) >= this.minimo || `A data deve ser a partir de ${dataBr(this.minimo)}`
      )
    },
  },
})
</script>
