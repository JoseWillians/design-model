# PRD: Manipulacao direta no canvas

## Objetivo

Tornar o canvas do Design Model mais fluido para criadores que querem montar templates visualmente, reduzindo a dependencia do inspector para acoes comuns de posicao, tamanho e escolha de formato.

## Contexto

O MVP ja permite selecionar camadas, editar propriedades, adicionar formas e exportar JSON/CSS. A proxima rodada deve evoluir o editor para interacoes diretas no canvas, presets de tamanho mais claros e uma base preparada para melhorias futuras sem aumentar demais o escopo de cada entrega.

## Escopo desta iteracao

- Mover camadas selecionadas arrastando diretamente no canvas.
- Redimensionar camadas selecionadas com alcas visuais.
- Melhorar precisao com grid, snap e ajustes por teclado.
- Oferecer presets de canvas mais praticos para desktop, tablet, mobile e formato livre.
- Persistir o preset escolhido e refletir essa informacao nas exportacoes.
- Registrar uma base de melhorias futuras priorizadas para proximas rodadas.

## Fora de escopo

- Colaboracao em tempo real.
- Edicao vetorial avancada.
- Historico completo de undo/redo.
- Importacao de arquivos externos.
- Backend ou sincronizacao em nuvem.

## Historias

1. Como criador de templates, quero arrastar uma camada selecionada no canvas para reposiciona-la sem usar campos numericos.
2. Como criador de templates, quero redimensionar uma camada por alcas no canvas para ajustar proporcoes visualmente.
3. Como criador de templates, quero usar grid, snap e nudges por teclado para alinhar camadas com precisao.
4. Como criador de templates, quero escolher presets de canvas para comecar rapidamente em tamanhos comuns.
5. Como criador de templates, quero que o preset do canvas seja salvo e exportado para manter a referencia portavel.
6. Como mantenedor, quero uma lista priorizada de melhorias futuras para orientar proximas iteracoes pequenas.

## Criterios gerais de aceite

- Cada historia e implementavel em uma sessao focada.
- Interacoes visuais devem ser verificadas em desktop e largura mobile/tablet quando aplicavel.
- `npm run typecheck` passa ao final de historias com codigo.
- `npm run build` passa antes de concluir a rodada.
- Exportacoes existentes continuam validas.
- Nenhum segredo, arquivo gerado ou dependencia local deve ser versionado.

## Melhorias futuras candidatas

- Undo/redo limitado para acoes de canvas.
- Guias inteligentes entre camadas.
- Bloqueio de camada para evitar edicao acidental.
- Agrupamento visual via selecao multipla.
- Importacao de JSON exportado.
- Biblioteca local de presets personalizados.
