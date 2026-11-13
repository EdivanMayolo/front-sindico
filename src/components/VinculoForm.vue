<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="preencher"
  >
    <q-card class="full-width">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ vinculo ? 'Editar vínculo' : 'Novo vínculo' }}</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>

      <q-form @submit="salvar">
        <q-card-section class="q-gutter-md">
          <!-- Novo: escolhe a pessoa e o tipo. Edição: pessoa e tipo não mudam -->
          <template v-if="!vinculo">
            <PessoaSelect v-model="form.id_pessoa" />
            <div>
              <div class="text-caption text-grey-8">Tipo de vínculo *</div>
              <q-option-group
                v-model="form.tipo_vinculo"
                :options="tipos"
                type="radio"
                inline
              />
            </div>
          </template>
          <q-item v-else>
            <q-item-section avatar>
              <q-icon :name="vinculo.tipo_vinculo === 'PROPRIETARIO' ? 'vpn_key' : 'person'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ vinculo.nome }}</q-item-label>
              <q-item-label caption>{{ tipoVinculo(vinculo.tipo_vinculo) }}</q-item-label>
            </q-item-section>
          </q-item>

          <!-- O inquilino sempre mora no apartamento (regra da API): só o proprietário escolhe -->
          <div v-if="ehInquilino" class="text-caption text-grey-7">
            O inquilino sempre mora no apartamento.
          </div>
          <q-toggle v-else v-model="form.reside" label="Mora no apartamento" color="positive" />

          <DataInput
            v-model="form.data_inicio"
            label="Início do vínculo"
            hint="Vazio = hoje"
          />
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
import VinculoService from 'src/services/VinculoService'
import PessoaSelect from 'src/components/PessoaSelect.vue'
import DataInput from 'src/components/DataInput.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { tipoVinculo } from 'src/utils/formatar'

export default defineComponent({
  name: 'VinculoForm',

  components: { PessoaSelect, DataInput },

  props: {
    modelValue: { type: Boolean, default: false },
    idApartamento: { type: Number, required: true },
    // Vínculo a editar; vazio = vínculo novo
    vinculo: { type: Object, default: null },
  },

  emits: ['update:modelValue', 'salvo'],

  data() {
    return {
      form: {},
      salvando: false,
      tipos: [
        { label: 'Proprietário', value: 'PROPRIETARIO' },
        { label: 'Inquilino', value: 'INQUILINO' },
      ],
    }
  },

  computed: {
    ehInquilino() {
      return (this.vinculo?.tipo_vinculo || this.form.tipo_vinculo) === 'INQUILINO'
    },
  },

  methods: {
    tipoVinculo,

    preencher() {
      const v = this.vinculo || {}
      this.form = {
        id_pessoa: null,
        tipo_vinculo: 'INQUILINO',
        reside: v.reside ?? true,
        data_inicio: v.data_inicio || null,
      }
    },

    async salvar() {
      this.salvando = true
      // Inquilino: sempre morador
      const reside = this.ehInquilino ? true : this.form.reside
      try {
        let mensagem = 'Vínculo salvo.'
        if (this.vinculo) {
          await VinculoService.alterar(this.vinculo.id_vinculo, {
            reside,
            data_inicio: this.form.data_inicio,
          })
        } else {
          const response = await VinculoService.criar({
            ...this.form,
            reside,
            id_apartamento: this.idApartamento,
          })
          // Troca de proprietário: avisa quem saiu
          const anterior = response.data.data.proprietario_encerrado
          if (anterior) mensagem = `Vínculo salvo. ${anterior} deixou de ser o proprietário.`
        }
        this.$q.notify({ type: 'positive', message: mensagem })
        this.$emit('salvo')
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
