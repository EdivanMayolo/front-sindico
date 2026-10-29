<template>
  <!-- Escolher uma pessoa ativa pelo nome ou CPF (nunca digitar o ID),
       com o botão para cadastrar uma pessoa nova sem sair da tela -->
  <q-select
    :model-value="modelValue"
    :options="opcoesFiltradas"
    option-value="id_pessoa"
    option-label="rotulo"
    emit-value
    map-options
    use-input
    input-debounce="0"
    :label="label"
    outlined
    hint="Digite para buscar pelo nome ou CPF"
    lazy-rules
    :rules="[(v) => !!v || 'Escolha a pessoa']"
    @update:model-value="$emit('update:modelValue', $event)"
    @filter="filtrar"
  >
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey">Nenhuma pessoa encontrada</q-item-section>
      </q-item>
    </template>
    <template #after>
      <q-btn round flat color="primary" icon="person_add" @click="novaPessoa = true">
        <q-tooltip>Cadastrar nova pessoa</q-tooltip>
      </q-btn>
    </template>
  </q-select>

  <!-- O mesmo formulário da tela de Pessoas -->
  <PessoaForm v-model="novaPessoa" @salvo="pessoaCriada" />
</template>

<script>
import { defineComponent } from 'vue'
import PessoaService from 'src/services/PessoaService'
import PessoaForm from 'src/components/PessoaForm.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { cpf } from 'src/utils/formatar'

export default defineComponent({
  name: 'PessoaSelect',

  components: { PessoaForm },

  props: {
    modelValue: { type: Number, default: null },
    label: { type: String, default: 'Pessoa *' },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      pessoas: [],
      opcoesFiltradas: [],
      novaPessoa: false,
    }
  },

  mounted() {
    this.carregar()
  },

  methods: {
    // Só pessoas ativas podem receber vínculo
    async carregar() {
      try {
        const response = await PessoaService.listar({ ativo: true })
        this.pessoas = response.data.data.map((p) => ({ ...p, rotulo: `${p.nome} — ${cpf(p.cpf)}` }))
        this.opcoesFiltradas = this.pessoas
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      }
    },

    // Busca pelo nome ou pelos números do CPF
    filtrar(texto, atualizar) {
      atualizar(() => {
        const nome = texto.toLowerCase()
        const numeros = texto.replace(/\D/g, '')
        this.opcoesFiltradas = this.pessoas.filter(
          (p) => p.nome.toLowerCase().includes(nome) || (numeros && p.cpf.includes(numeros)),
        )
      })
    },

    // A pessoa recém-cadastrada entra na lista e já fica escolhida
    async pessoaCriada(pessoa) {
      await this.carregar()
      this.$emit('update:modelValue', pessoa.id_pessoa)
    },
  },
})
</script>
