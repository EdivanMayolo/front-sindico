<template>
  <q-page padding>
    <div class="text-h5">Olá, {{ usuario.nome }}!</div>
    <div class="text-subtitle1 text-grey-7 q-mb-md">Bem-vindo ao CondoSimples.</div>

    <!-- O painel com saldo, apartamentos e leitura de gás vem na parte 8 -->
    <q-banner rounded class="bg-blue-1">
      <template #avatar>
        <q-icon name="info" color="primary" />
      </template>
      Use o menu para acessar as funções do sistema.
    </q-banner>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useAuthStore } from 'src/stores/auth'

export default defineComponent({
  name: 'IndexPage',

  computed: {
    ...mapState(useAuthStore, ['usuario']),
  },
})
</script>
