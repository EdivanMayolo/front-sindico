<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="preencher"
  >
    <q-card class="full-width">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ receita ? 'Editar receita' : 'Nova receita' }}</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>

      <q-form @submit="salvar">
        <q-card-section class="row q-col-gutter-md">
          <!-- 60A: pagamento de fatura escolhido na lista (reconhecimento, não memorização).
               Só preenche a descrição e o valor; a receita não fica ligada à fatura (decisão 2A da API). -->
          <q-select
            v-if="!receita"
            v-model="fatura"
            class="col-12"
            :options="opcoesFiltradas"
            option-label="rotulo"
            use-input
            input-debounce="0"
            clearable
            outlined
            label="Pagamento de fatura (opcional)"
            hint="Escolha a fatura paga para preencher a descrição e o valor"
            @filter="filtrar"
            @update:model-value="escolherFatura"
          >
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey">Nenhuma fatura encontrada</q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-input
            v-model="form.descricao"
            class="col-12"
            label="Descrição *"
            placeholder="Ex.: Pagamento fatura 10/2026 - Apto 101"
            maxlength="150"
            outlined
            lazy-rules
            :rules="[(v) => !!(v && v.trim()) || 'Informe a descrição']"
          />

          <ValorInput v-model="form.valor" class="col-12 col-sm-6" label="Valor *" obrigatorio />

          <DataInput
            v-model="form.data_recebimento"
            class="col-12 col-sm-6"
            label="Data de recebimento *"
            obrigatorio
          />

          <q-input
            v-model="form.observacao"
            class="col-12"
            type="textarea"
            label="Observação"
            hint="Opcional"
            maxlength="255"
            autogrow
            outlined
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
import ReceitaService from 'src/services/ReceitaService'
import FaturaService from 'src/services/FaturaService'
import ValorInput from 'src/components/ValorInput.vue'
import DataInput from 'src/components/DataInput.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { dinheiro, mesAno, nomeApto } from 'src/utils/formatar'

export default defineComponent({
  name: 'ReceitaForm',

  components: { ValorInput, DataInput },

  props: {
    modelValue: { type: Boolean, default: false },
    // Receita a editar; vazio = cadastro novo
    receita: { type: Object, default: null },
    // Data sugerida no cadastro novo (o mês que está aberto na tela)
    dataPadrao: { type: String, default: null },
  },

  emits: ['update:modelValue', 'salvo'],

  data() {
    return {
      form: {},
      fatura: null,
      faturas: [],
      opcoesFiltradas: [],
      salvando: false,
    }
  },

  methods: {
    preencher() {
      const r = this.receita || {}
      this.form = {
        descricao: r.descricao || '',
        valor: r.valor ?? null,
        data_recebimento: r.data_recebimento || this.dataPadrao,
        observacao: r.observacao || '',
      }
      this.fatura = null
      if (!this.receita) this.carregarFaturas()
    },

    // Mais recentes primeiro (ordem da API); as canceladas não valem
    async carregarFaturas() {
      try {
        const response = await FaturaService.listar()
        this.faturas = response.data.data
          .filter((f) => f.status !== 'CANCELADA')
          .map((f) => ({
            ...f,
            rotulo: `Fatura ${mesAno(f.mes_referencia, f.ano_referencia)} · Apto ${nomeApto(f)} · ${dinheiro(f.valor_total)}`,
          }))
        this.opcoesFiltradas = this.faturas
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      }
    },

    // Busca por qualquer parte do texto: "10/2026", "101", "230"...
    filtrar(texto, atualizar) {
      atualizar(() => {
        const busca = texto.toLowerCase()
        this.opcoesFiltradas = this.faturas.filter((f) => f.rotulo.toLowerCase().includes(busca))
      })
    },

    // Texto sugerido pela decisão 2A da API
    escolherFatura(f) {
      if (!f) return
      this.form.descricao = `Pagamento fatura ${mesAno(f.mes_referencia, f.ano_referencia)} - Apto ${nomeApto(f)}`
      this.form.valor = f.valor_total
    },

    async salvar() {
      const dados = {
        descricao: this.form.descricao,
        valor: this.form.valor,
        data_recebimento: this.form.data_recebimento,
        observacao: this.form.observacao,
      }

      this.salvando = true
      try {
        const response = this.receita
          ? await ReceitaService.alterar(this.receita.id_receita, dados)
          : await ReceitaService.criar(dados)
        this.$q.notify({ type: 'positive', message: 'Receita salva.' })
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
