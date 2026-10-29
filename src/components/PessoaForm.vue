<template>
  <!-- v-model abre e fecha a janela (props/v-model/emit, como na aula VUE++) -->
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="preencher"
  >
    <q-card class="full-width">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ pessoa ? 'Editar pessoa' : 'Nova pessoa' }}</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>

      <q-form @submit="salvar">
        <!-- Grid do Quasar: no celular um campo por linha; a partir do tablet, CPF e telefone lado a lado -->
        <q-card-section class="row q-col-gutter-md">
          <q-input
            v-model="form.nome"
            class="col-12"
            label="Nome *"
            outlined
            autofocus
            lazy-rules
            :rules="[(v) => !!v || 'Informe o nome']"
          />
          <q-input
            v-model="form.cpf"
            class="col-12 col-sm-6"
            label="CPF *"
            mask="###.###.###-##"
            outlined
            lazy-rules
            :rules="[(v) => (v && v.length === 14) || 'Informe o CPF com 11 números']"
          />
          <q-input
            v-model="form.telefone"
            class="col-12 col-sm-6"
            label="Telefone *"
            mask="(##) #####-####"
            outlined
            lazy-rules
            :rules="[(v) => !!v || 'Informe o telefone']"
          />
          <q-input
            v-model="form.email"
            class="col-12"
            type="email"
            label="E-mail"
            outlined
            hint="Opcional"
          />
          <q-input
            v-model="form.endereco"
            class="col-12"
            label="Endereço"
            outlined
            hint="Opcional"
          />
          <div v-if="pessoa" class="col-12">
            <q-toggle v-model="form.ativo" label="Pessoa ativa" color="positive" />
          </div>
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
import PessoaService from 'src/services/PessoaService'
import mensagemErro from 'src/utils/mensagemErro'
import { cpf } from 'src/utils/formatar'

export default defineComponent({
  name: 'PessoaForm',

  props: {
    modelValue: { type: Boolean, default: false },
    // Pessoa a editar; vazio = cadastro novo
    pessoa: { type: Object, default: null },
  },

  emits: ['update:modelValue', 'salvo'],

  data() {
    return {
      form: {},
      salvando: false,
    }
  },

  methods: {
    // Ao abrir a janela: copia a pessoa (edição) ou começa em branco (novo)
    preencher() {
      const p = this.pessoa || {}
      this.form = {
        nome: p.nome || '',
        cpf: cpf(p.cpf),
        telefone: p.telefone || '',
        email: p.email || '',
        endereco: p.endereco || '',
        ativo: p.ativo ?? true,
      }
    },

    async salvar() {
      this.salvando = true
      try {
        // O CPF vai com a máscara: a API limpa e grava só os 11 números
        const response = this.pessoa
          ? await PessoaService.alterar(this.pessoa.id_pessoa, this.form)
          : await PessoaService.criar(this.form)
        this.$q.notify({ type: 'positive', message: 'Pessoa salva.' })
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
