<template>
  <!-- Item avulso da fatura (55A): multa, taxa extra... O total é recalculado pelo banco. -->
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="preencher"
  >
    <q-card class="full-width">
      <q-card-section class="row items-center">
        <div class="text-h6">Adicionar item</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>

      <q-form @submit="salvar">
        <q-card-section class="row q-col-gutter-md">
          <q-input
            v-model="form.descricao"
            class="col-12"
            label="Descrição *"
            placeholder="Ex.: Multa por barulho após as 22h"
            maxlength="150"
            outlined
            autofocus
            lazy-rules
            :rules="[(v) => !!(v && v.trim()) || 'Informe a descrição']"
          />
          <ValorInput
            v-model="form.valor"
            class="col-12 col-sm-6"
            label="Valor *"
            hint="Entra só na fatura deste apartamento"
            obrigatorio
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" />
          <q-btn type="submit" color="primary" label="Adicionar" unelevated :loading="salvando" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'
import FaturaService from 'src/services/FaturaService'
import ValorInput from 'src/components/ValorInput.vue'
import mensagemErro from 'src/utils/mensagemErro'

export default defineComponent({
  name: 'ItemFaturaForm',

  components: { ValorInput },

  props: {
    modelValue: { type: Boolean, default: false },
    // Fatura que recebe o item
    fatura: { type: Object, default: null },
  },

  emits: ['update:modelValue', 'salvo'],

  data() {
    return {
      form: { descricao: '', valor: null },
      salvando: false,
    }
  },

  methods: {
    preencher() {
      this.form = { descricao: '', valor: null }
    },

    async salvar() {
      this.salvando = true
      try {
        // A API devolve a fatura atualizada (com o novo total)
        const response = await FaturaService.adicionarItem(this.fatura.id_fatura, {
          descricao: this.form.descricao.trim(),
          valor: this.form.valor,
        })
        this.$q.notify({ type: 'positive', message: 'Item adicionado.' })
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
