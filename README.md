# CondoSimples (front-sindico)

Frontend do **CondoSimples** — Sistema de Autogestão Condominial.

TCC II de Sistemas de Informação — Acadêmico: Edivan Mayolo · Orientador: Gabriel Luiz Kunz

Feito com Quasar (Vue 3), Pinia e Axios. Consome a API `api-sindico`.

## Instruções

A API (`api-sindico`) precisa estar rodando em `http://localhost:3000`.

Na pasta do projeto, execute:

```bash
npm install
npm run dev
```

O sistema abre em `http://localhost:9000`.

## Estrutura

```
src/
  boot/      axios (endereço da API e envio do token)
  layouts/   layout principal (barra do topo e menu)
  pages/     telas do sistema
  router/    rotas e proteção das telas (login e perfil)
  services/  chamadas à API, uma classe por recurso
  stores/    Pinia (usuário logado)
  utils/     funções de apoio
```
