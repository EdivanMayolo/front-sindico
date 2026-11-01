<template>
  <!-- Campo de senha com o ícone de mostrar/esconder (o mesmo da tela de login) -->
  <q-input
    :model-value="modelValue"
    :type="mostrar ? 'text' : 'password'"
    :label="label"
    :hint="hint"
    :autocomplete="autocomplete"
    outlined
    lazy-rules
    :rules="rules"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #append>
      <q-icon
        :name="mostrar ? 'visibility_off' : 'visibility'"
        class="cursor-pointer"
        @click="mostrar = !mostrar"
      >
        <q-tooltip>{{ mostrar ? 'Esconder senha' : 'Mostrar senha' }}</q-tooltip>
      </q-icon>
    </template>
  </q-input>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SenhaInput',

  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, default: 'Senha' },
    hint: { type: String, default: '' },
    rules: { type: Array, default: () => [] },
    // "new-password" impede o navegador de preencher sozinho com a senha salva de quem está logado
    autocomplete: { type: String, default: 'new-password' },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      mostrar: false,
    }
  },
})
</script>
