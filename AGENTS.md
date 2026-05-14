# AGENTS.md - Design Model

## Contexto do projeto

- Aplicacao web React 18 + TypeScript + Vite para montar templates visuais, editar camadas e exportar referencias em JSON/CSS.
- O deploy alvo e Vercel; mantenha o projeto compativel com build estatico via `npm run build`.
- O MVP valoriza persistencia local no navegador e uma experiencia visual responsiva.

## Higiene para GitHub publico

- Nunca versionar `node_modules/`, `dist/`, `graphify-out/`, caches, relatórios de teste ou arquivos `.env*`.
- Se novas variaveis forem necessarias, registre apenas nomes e exemplos seguros em `.env.example`.
- Antes de publicar ou abrir PR, confirme que nenhum segredo foi adicionado ao frontend, historico local ou artefatos gerados.

## Graphify

- Use `.graphifyignore` antes de gerar mapas do projeto.
- Se `graphify-out/` existir, trate como artefato local e nao como fonte a versionar.
- Para atualizar o grafo local, o comando esperado em PowerShell e `graphify extract . --out .`.

## Deploy Vercel

- Comandos esperados: `npm install`, `npm run build`.
- Nao comitar `.vercel/`; ele contem estado local da CLI.
- Se o projeto ganhar rotas/API ou variaveis de ambiente, documente validacao e riscos antes do deploy.

## Aprendizados uteis

- O README atual define `npm run build` como validacao minima antes de concluir mudancas.
- Mudancas visuais relevantes devem ser conferidas em desktop e mobile.
- Este arquivo deve guardar apenas contexto especifico do projeto, sem duplicar as instrucoes globais do ambiente.
