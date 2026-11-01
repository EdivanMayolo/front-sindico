<template>
  <!-- Campo de dinheiro no formato brasileiro: o usuário digita só os números
       e a vírgula vai andando (como na maquininha): 1 → 0,01 · 12 → 0,12 · 1234 → 12,34.
       O v-model recebe o número (12.34), o formato da API. -->
  <q-input
    :model-value="texto"
    :label="label"
    :hint="hint"
    :disable="disable"
    prefix="R$"
    inputmode="numeric"
    outlined
    lazy-rules
    :rules="[validar]"
    @update:model-value="alterar"
  />
</template>

<script>
import { defineComponent } from 'vue'

// 1234.5 → "1.234,50"
const formatar = (valor) =>
  valor === null || valor === undefined
    ? ''
    : valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default defineComponent({
  name: 'ValorInput',

  props: {
    modelValue: { type: Number, default: null },
    label: { type: String, default: 'Valor' },
    hint: { type: String, default: '' },
    disable: { type: Boolean, default: false },
    obrigatorio: { type: Boolean, default: false },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      texto: formatar(this.modelValue),
    }
  },

  watch: {
    modelValue(valor) {
      this.texto = formatar(valor)
    },
  },

  methods: {
    // Fica só com os números e trata como centavos (conta em inteiros, sem erro de arredondamento).
    // Até 10 números: o banco guarda no máximo 99.999.999,99 (DECIMAL(10,2)).
    alterar(texto) {
      const numeros = String(texto || '')
        .replace(/\D/g, '')
        .slice(0, 10)
      // Zero vira campo vazio: apagando tudo, o campo fica em branco (e não preso em "0,00")
      const valor = Number(numeros) ? Number(numeros) / 100 : null
      // Mostra o que foi digitado e, logo depois, o texto formatado. Sem isso, uma letra
      // digitada ficava na tela: o texto formatado não mudava e o Vue não redesenhava o campo.
      this.texto = texto
      this.$nextTick(() => {
        this.texto = formatar(valor)
      })
      this.$emit('update:modelValue', valor)
    },

    validar() {
      if (!this.modelValue) return !this.obrigatorio || 'Informe um valor maior que zero'
      return true
    },
  },
})
</script>
