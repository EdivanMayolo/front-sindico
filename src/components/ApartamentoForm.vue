<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="preencher"
  >
    <q-card class="full-width">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ apartamento ? 'Editar apartamento' : 'Novo apartamento' }}</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>

      <q-form @submit="salvar">
        <!-- Grid do Quasar: no celular um campo por linha; a partir do tablet, 3 por linha -->
        <q-card-section class="row q-col-gutter-md">
          <q-input
            v-model="form.numero"
            class="col-12 col-sm-4"
            label="Número *"
            outlined
            autofocus
            lazy-rules
            :rules="[(v) => !!v || 'Informe o número']"
          />
          <q-input
            v-model="form.bloco"
            class="col-12 col-sm-4"
            label="Bloco"
            outlined
            hint="Vazio se não houver blocos"
          />
          <q-input v-model="form.andar" class="col-12 col-sm-4" label="Andar" outlined />

          <!-- Só no cadastro: todo apartamento ativo precisa de um proprietário -->
          <template v-if="!apartamento">
            <div class="col-12">
              <PessoaSelect v-model="form.id_pessoa_proprietario" label="Proprietário *" />
            </div>
            <div class="col-12">
              <q-toggle
                v-model="form.reside"
                label="O proprietário mora no apartamento"
                color="positive"
              />
            </div>
          </template>
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
import ApartamentoService from 'src/services/ApartamentoService'
import PessoaSelect from 'src/components/PessoaSelect.vue'
import mensagemErro from 'src/utils/mensagemErro'

export default defineComponent({
  name: 'ApartamentoForm',

  components: { PessoaSelect },

  props: {
    modelValue: { type: Boolean, default: false },
    // Apartamento a editar; vazio = cadastro novo
    apartamento: { type: Object, default: null },
  },

  emits: ['update:modelValue', 'salvo'],

  data() {
    return {
      form: {},
      salvando: false,
    }
  },

  methods: {
    preencher() {
      const a = this.apartamento || {}
      this.form = {
        numero: a.numero || '',
        bloco: a.bloco || '',
        andar: a.andar || '',
        id_pessoa_proprietario: null,
        reside: false,
      }
    },

    async salvar() {
      this.salvando = true
      try {
        const response = this.apartamento
          ? await ApartamentoService.alterar(this.apartamento.id_apartamento, {
              numero: this.form.numero,
              bloco: this.form.bloco,
              andar: this.form.andar,
            })
          : await ApartamentoService.criar(this.form)
        this.$q.notify({ type: 'positive', message: 'Apartamento salvo.' })
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
