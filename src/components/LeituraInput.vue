<template>
  <!-- Número do relógio de gás (41A): até 3 casas decimais, com vírgula ou ponto
       (1256,5 ou 1256.5). O v-model recebe o número (1256.5), o formato da API. -->
  <q-input
    :model-value="texto"
    :label="label"
    :hint="hint"
    :disable="disable"
    :autofocus="autofocus"
    suffix="m³"
    inputmode="decimal"
    outlined
    lazy-rules
    :rules="[validar, ...rules]"
    @update:model-value="alterar"
  />
</template>

<script>
import { defineComponent } from 'vue'

// Até 7 números antes da vírgula e 3 depois: o banco guarda DECIMAL(10,3)
const FORMATO = /^\d{1,7}([.,]\d{1,3})?$/

// 1256.5 → "1256,5" (sem ponto de milhar no campo, para não confundir com a vírgula)
const formatar = (valor) =>
  valor === null || valor === undefined
    ? ''
    : valor.toLocaleString('pt-BR', { maximumFractionDigits: 3, useGrouping: false })

// "1256,5" → 1256.5; texto incompleto ou inválido → null
const converter = (texto) => (FORMATO.test(texto) ? Number(texto.replace(',', '.')) : null)

export default defineComponent({
  name: 'LeituraInput',

  props: {
    modelValue: { type: Number, default: null },
    label: { type: String, default: 'Leitura' },
    hint: { type: String, default: '' },
    disable: { type: Boolean, default: false },
    autofocus: { type: Boolean, default: false },
    obrigatorio: { type: Boolean, default: false },
    // Regras a mais (ex.: a leitura atual não pode ser menor que a anterior)
    rules: { type: Array, default: () => [] },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      texto: formatar(this.modelValue),
    }
  },

  watch: {
    // Valor vindo de fora (ex.: leitura anterior preenchida). Enquanto o usuário
    // digita "1256," o número ainda é o mesmo, e o texto dele não é trocado.
    modelValue(valor) {
      if (valor !== converter(this.texto)) this.texto = formatar(valor)
    },
  },

  methods: {
    // Aceita só números, vírgula e ponto. Mesmo truque do ValorInput: mostra o que
    // foi digitado e, logo depois, o texto limpo (senão a letra ficava na tela).
    alterar(texto) {
      const limpo = String(texto || '').replace(/[^\d.,]/g, '')
      this.texto = texto
      this.$nextTick(() => {
        this.texto = limpo
      })
      this.$emit('update:modelValue', converter(limpo))
    },

    validar() {
      if (!this.texto) return !this.obrigatorio || 'Informe a leitura do relógio'
      return (
        FORMATO.test(this.texto) || 'Número inválido (até 3 casas depois da vírgula). Ex.: 1256,5'
      )
    },
  },
})
</script>
