# Roadmap do Design Model

Este roadmap organiza a evolucao publica do Design Model. Ele deve guiar contribuicoes, mas pode mudar conforme feedback de usuarios e maturidade do MVP.

## Agora: estabilizacao do MVP

Objetivo: tornar o editor atual confiavel, compreensivel e facil de validar.

- Validar importacao/exportacao de JSON em navegador.
- Validar API local para agentes de IA em navegador.
- Melhorar feedback visual de salvamento local.
- Criar testes unitarios para exportacao JSON/CSS.
- Criar testes unitarios para persistencia local.
- Criar testes unitarios para helpers de geometria do canvas.
- Documentar o formato `TemplateDocument` com exemplos.
- Refinar estados vazios e mensagens de erro.
- Validar acessibilidade basica do canvas, camadas e inspector.
- Melhorar responsividade em tablet e mobile.
- Revisar contraste, foco visivel e navegacao por teclado.

## Proximo: fluxo de templates

Objetivo: facilitar criacao, reuso e organizacao de modelos.

- Editar metadados do template: nome, descricao, categoria e tags.
- Adicionar filtros por categoria e busca textual.
- Permitir ordenar ou agrupar camadas.
- Criar exemplos publicos de templates por caso de uso.

## Depois: editor visual mais completo

Objetivo: dar mais controle sem perder simplicidade.

- Controles de alinhamento e distribuicao.
- Smart guides para alinhar camadas entre si.
- Atalhos de teclado para navegar entre camadas.
- Undo/redo para operacoes principais.
- Edicao de imagens com URL e texto alternativo.
- Controles de borda, opacidade e sombra.
- Reordenar camadas por drag and drop com alternativa acessivel.
- Preview de diferentes tamanhos de tela.
- Seleção múltipla e alinhamento entre camadas.

## Concluido recentemente

- Importar template a partir de JSON exportado pelo app.
- Permitir dimensoes customizadas de canvas alem dos presets.
- Sidebar esquerda recolhivel.
- Atalhos de teclado para alternar snap, duplicar, excluir e bloquear camadas.
- Bloquear e desbloquear camadas.
- Presets de canvas para desktop, tablet, mobile, square e story.
- Pasteboard amplo ao redor do canvas.
- Ações de alinhamento, ordem visual, opacidade, borda e imagem no inspector.
- API local `window.designModelAgent` para automações e agentes de IA.

## Futuro: compartilhamento e colaboracao leve

Objetivo: transformar templates em artefatos compartilhaveis.

- Exportar imagem do canvas.
- Compartilhar projeto por link estatico.
- Gerar pacote de assets do template.
- Historico simples de versoes locais.
- Comentarios assincromos em nivel de template ou camada.
- Organizacao por cliente, workspace ou colecao.
- Sincronizacao opcional com backend.

## Futuro tecnico

Objetivo: preparar o projeto para escala, contribuicao e deploy continuo.

- Configurar testes E2E com Playwright.
- Adicionar CI para typecheck e build.
- Adicionar lint/format quando o padrao for definido.
- Publicar preview automatico em pull requests.
- Documentar estrategia de versionamento.
- Adicionar guia de arquitetura mais detalhado.
- Criar exemplos de integracao com dados externos.

## Fora do escopo imediato

- Marketplace publico de templates.
- Editor vetorial completo.
- Colaboracao em tempo real.
- Sistema avancado de permissoes.
- Automacao de publicacao em producao.
- Dependencia obrigatoria de servicos externos.

## Como contribuir com o roadmap

Abra uma issue ou pull request explicando:

- qual problema a proposta resolve;
- quem se beneficia;
- como validar a entrega;
- quais riscos ou impactos existem;
- se a mudanca afeta dados exportados ou compatibilidade de templates.
