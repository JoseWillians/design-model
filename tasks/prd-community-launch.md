# PRD: Lancamento publico do Design Model

## Objetivo

Publicar o Design Model como projeto open-source, hospedar uma versao online e preparar o app para evolucao colaborativa.

## Escopo desta iteracao

- Documentar o projeto para contribuidores.
- Adicionar fluxo para criar template em branco.
- Gerar grafo de conhecimento com Graphify.
- Inicializar Git, publicar no GitHub e fazer deploy na Vercel.
- Validar build, typecheck, audit e interface principal.

## Historias

1. Como criador de templates, quero iniciar uma tela em branco para montar meu proprio template sem depender de modelos iniciais.
2. Como contribuidor, quero README e guia de contribuicao claros para entender stack, comandos, arquitetura e roadmap.
3. Como mantenedor, quero um grafo do projeto para visualizar arquitetura e facilitar futuras evolucoes.
4. Como usuario externo, quero acessar o app online sem configurar ambiente local.

## Criterios de aceite

- Existe acao visivel para criar template em branco.
- O template em branco aparece na lista e pode receber camadas.
- `npm run typecheck` passa.
- `npm run build` passa.
- `npm audit --audit-level=moderate` passa sem vulnerabilidades.
- Graphify gera `graphify-out/GRAPH_REPORT.md`.
- Repositorio GitHub publico criado e com codigo enviado.
- Deploy Vercel acessivel por URL publica.
- README explica contribuicao e roadmap.
