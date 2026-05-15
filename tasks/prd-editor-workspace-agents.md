# PRD: Expansão do editor, workspace e agentes locais

## Objetivo

Evoluir o Design Model para uma experiência de edição visual mais confortável e prepará-lo para automações locais com agentes de IA, mantendo o produto local-first, estático no deploy da Vercel e seguro para publicação open-source.

## Contexto

O editor já possui templates locais, camadas editáveis, inspector, manipulação direta no canvas, persistência em `localStorage`, exportação/importação de JSON e exportação CSS. A próxima rodada deve melhorar a ergonomia do workspace, ampliar recursos visuais do editor e definir uma API local para agentes sem transformar o produto público em uma aplicação com backend obrigatório.

Há também uma dívida de linguagem: parte da documentação e da UI usa texto sem acentuação. A rodada deve corrigir isso de forma controlada, preservando identificadores técnicos, nomes de arquivos, chaves JSON, classes CSS e comandos.

## Escopo desta iteração

- Mover ou duplicar o botão de recolher para dentro da sidebar esquerda, mantendo a ação fácil de encontrar.
- Aumentar a área de trabalho ao redor do canvas, tratando o pasteboard como espaço real de edição, não apenas como fundo justo ao canvas.
- Priorizar recursos de editor visual que aumentem controle sem criar um editor profissional complexo.
- Especificar uma API local para agentes de IA operarem templates durante desenvolvimento, com validação e limites claros.
- Corrigir acentuação em documentação e textos visíveis da UI, sem alterar identificadores técnicos.

## Fora de escopo

- Backend em produção na Vercel.
- Autenticação de usuários finais, contas ou colaboração em tempo real.
- Sincronização em nuvem.
- API pública remota para terceiros.
- Substituir o inspector numérico por manipulação exclusivamente visual.
- Alterar `README.md`, `ROADMAP.md`, `src/` ou arquivos fora de `tasks/` nesta rodada de planejamento.

## Histórias

1. Como criador de templates, quero recolher a sidebar a partir de um botão dentro dela para entender melhor que o controle pertence ao painel esquerdo.
2. Como criador de templates, quero uma área de trabalho maior ao redor do canvas para navegar, posicionar e revisar composições com mais conforto.
3. Como usuário lusófono, quero documentação e UI com acentuação correta para que o produto pareça mais cuidado e profissional.
4. Como criador de templates, quero recursos visuais adicionais no editor para ajustar camadas com menos dependência de campos manuais.
5. Como agente de IA local, quero uma API de desenvolvimento para ler, criar e atualizar templates de forma validada.

## Critérios gerais de aceite

- Cada história deve ser implementável de forma independente em uma sessão focada.
- Mudanças visuais devem ser verificadas em desktop e largura mobile/tablet.
- `npm run typecheck` deve passar ao final de histórias com código.
- `npm run build` deve passar antes de concluir a rodada.
- Recursos locais para agentes devem ser desativados ou inexistentes no build estático de produção.
- Nenhum segredo, token ou `.env` real deve ser lido, exposto ou versionado.
- Acentos devem ser corrigidos em textos humanos, mas identificadores técnicos devem permanecer estáveis.

## Histórias detalhadas

### US-001: Botão de recolher dentro da sidebar

Como criador de templates, quero recolher a sidebar a partir de um botão dentro dela para entender melhor que o controle pertence ao painel esquerdo.

#### Critérios de aceite

- A sidebar esquerda exibe um botão interno para recolher o painel.
- Quando a sidebar está recolhida, existe um controle visível e acessível para expandi-la novamente.
- O estado recolhido não esconde ações críticas sem alternativa acessível.
- O controle possui label acessível e tooltip curto com acentuação correta.
- O layout não sobrepõe toolbar, canvas ou inspector em desktop, tablet e mobile.
- Typecheck passes.
- Build passes.
- Verify in browser.

### US-002: Área de trabalho e pasteboard maiores

Como criador de templates, quero uma área de trabalho maior ao redor do canvas para navegar, posicionar e revisar composições com mais conforto.

#### Critérios de aceite

- O workspace oferece margem/pasteboard maior ao redor do canvas em zoom normal.
- O usuário consegue rolar ou navegar pelo pasteboard sem perder acesso à toolbar principal.
- Canvas grande, presets mobile e dimensões customizadas continuam centralizados ou enquadrados de forma previsível.
- Zoom, snap, drag, resize e nudges por teclado continuam funcionando dentro do novo espaço.
- Em telas menores, o pasteboard não cria corte permanente de conteúdo nem impede selecionar camadas.
- Typecheck passes.
- Build passes.
- Verify in browser.

### US-003: Acentuação correta em docs e UI

Como usuário lusófono, quero documentação e UI com acentuação correta para que o produto pareça mais cuidado e profissional.

#### Critérios de aceite

- Textos humanos em documentação relevante e UI visível usam acentuação correta em português do Brasil.
- Identificadores técnicos, nomes de arquivos, comandos, chaves JSON, nomes de eventos, classes CSS e URLs não são alterados apenas por acentuação.
- Não há sinais de mojibake, como `Ã`, `Â`, `�` ou caracteres quebrados em docs/UI revisados.
- A revisão cobre pelo menos `tasks/`, textos visíveis do editor e mensagens de erro do fluxo de importação/exportação.
- Mudanças de texto não alteram comportamento, persistência local ou formato de exportação.
- Typecheck passes.
- Build passes.
- Verify in browser for visible UI strings.

### US-004: Recursos de editor visual

Como criador de templates, quero recursos visuais adicionais no editor para ajustar camadas com menos dependência de campos manuais.

#### Critérios de aceite

- A rodada implementa pelo menos dois recursos pequenos e verificáveis de edição visual, escolhidos entre: opacidade, borda, sombra, ordem de camada, alinhamento rápido, distribuição simples ou guias de alinhamento.
- Cada recurso possui controle visual claro no inspector, toolbar ou lista de camadas, seguindo o padrão atual do projeto.
- Alterações feitas por controles visuais refletem no canvas, na persistência local e na exportação JSON.
- Quando aplicável, a exportação CSS inclui o novo estilo sem quebrar templates antigos.
- Recursos que não se aplicam a certos tipos de camada ficam indisponíveis ou têm fallback previsível.
- Typecheck passes.
- Build passes.
- Verify in browser.

### US-005: API local para agentes de IA

Como agente de IA local, quero uma API de desenvolvimento para ler, criar e atualizar templates de forma validada.

#### Critérios de aceite

- Existe uma especificação em `tasks/` para endpoints locais mínimos antes da implementação.
- A API proposta é local-only, voltada a desenvolvimento, e não é necessária para o build estático da Vercel.
- Endpoints cobrem pelo menos listar templates, obter template por id, validar template, criar template e atualizar template.
- Entradas são validadas com Zod ou equivalente antes de alterar qualquer estado.
- CORS é restrito a origens locais esperadas durante desenvolvimento.
- Erros retornam mensagens úteis sem vazar stack trace, caminhos locais, tokens ou dados sensíveis.
- A API não exige nem expõe chaves de LLM; agentes externos devem chamar seus próprios modelos fora do frontend.
- Typecheck passes.
- Tests pass for API validation.
- Build passes.

## Sequência sugerida

1. Botão de recolher dentro da sidebar.
2. Área de trabalho e pasteboard maiores.
3. Acentuação correta em docs e UI.
4. Recursos de editor visual.
5. API local para agentes de IA.

## Riscos e validação

- Mover controles da sidebar pode reduzir descoberta em telas pequenas; validar estados recolhido e expandido em desktop e mobile.
- Aumentar pasteboard pode afetar scroll, foco e seleção; validar zoom, snap, drag, resize e teclado.
- Novos estilos de camada podem exigir migração defensiva para templates antigos; manter defaults compatíveis.
- A API local aumenta superfície de risco se virar produção por acidente; manter local-only, sem segredos e com CORS restrito.
- Correções de acentuação podem quebrar snapshots, testes por texto ou seletores frágeis; preferir labels acessíveis estáveis quando possível.
