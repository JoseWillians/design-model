# Design System

Este design system guia o app React/Vite para criar templates visuais de projetos. A interface deve parecer uma ferramenta de trabalho criativa: precisa ser precisa, escaneavel e rapida, mas ainda ter personalidade suficiente para inspirar composicao visual.

## Principios Visuais

1. **Canvas primeiro:** a area de criacao e preview deve ser o elemento dominante. Barras, paineis e menus apoiam a criacao sem competir com ela.
2. **Densidade controlada:** ferramentas podem ser compactas, mas nunca espremidas. Agrupe controles por funcao e use separadores sutis.
3. **Contraste funcional:** texto, foco, selecao e estados criticos devem cumprir contraste WCAG AA. Nao dependa apenas de cor para erro, sucesso ou selecao.
4. **Acao clara:** comandos primarios usam cor de destaque; comandos secundarios ficam neutros. Estados hover, focus, active, disabled e loading devem existir.
5. **Preview honesto:** cards e thumbnails precisam mostrar o conteudo real do template, com proporcoes estaveis e sem crop enganoso.
6. **Movimento discreto:** animacoes devem orientar mudancas de estado, nao decorar a tela. Respeite `prefers-reduced-motion`.
7. **Responsivo por tarefa:** desktop prioriza canvas + painel lateral; tablet usa paineis recolhiveis; mobile prioriza navegacao por abas e edicao em etapas.

## Personalidade

- **Precisao:** linhas limpas, alinhamento forte, medidas consistentes.
- **Criatividade contida:** acentos vivos em selecao, insercao, exportacao e estados ativos.
- **Produto profissional:** sem aparencia de landing page, sem excesso de cards decorativos, sem fundos puramente atmosfericos.
- **Leitura rapida:** hierarquia tipografica curta, labels diretos, iconografia familiar.

## Tokens

Os tokens vivem em `src/design/tokens.ts` e devem ser a fonte de referencia para CSS, componentes e futuras bibliotecas de UI.

### Cores

- **Background:** superfices frias e neutras para reduzir fadiga visual.
- **Foreground:** texto escuro com alto contraste.
- **Primary:** azul-indigo para selecao, foco e estados ativos.
- **Accent:** coral/laranja para a acao principal, como criar, exportar ou aplicar template.
- **Success, warning, danger:** semanticas de status, sempre acompanhadas de texto ou icone.

Use acentos com parcimonia. Em uma tela operacional, a cor mais forte deve indicar onde agir ou o que esta selecionado.

### Tipografia

Fonte padrao: `Inter`, com fallback para `ui-sans-serif` e `system-ui`.

- **Display:** nomes de projeto, titulo de editor ou tela vazia importante.
- **Heading:** secoes e paineis.
- **Body:** conteudo principal e textos de apoio.
- **Label:** controles, propriedades, tabs e metadados.
- **Mono:** medidas, tokens, IDs e valores tecnicos.

Evite texto hero-scale dentro de paineis, sidebars e cards compactos.

### Espacamento

Base de 4px. A escala deve favorecer layouts precisos:

- `1-3`: ajustes internos pequenos.
- `4-6`: padding de controles e grupos.
- `8-12`: gaps entre blocos de painel.
- `16-24`: margens de pagina e areas principais.

### Radius

Use radius moderado. Cards e paineis ficam entre 6px e 8px; elementos pequenos podem usar 4px. Evite cantos muito arredondados em ferramentas densas.

### Shadows

Sombras devem indicar elevacao ou sobreposicao:

- `xs/sm`: controles, popovers leves.
- `md`: menus, dropdowns, paineis flutuantes.
- `lg`: modais e overlays.

Nao use sombra como decoracao constante em secoes inteiras.

### Motion

- Duracao curta para UI: 120ms a 220ms.
- Duracao media para entrada/saida de paineis: 240ms a 320ms.
- Easing padrao: `cubic-bezier(0.2, 0, 0, 1)`.
- Para reduced motion, remova transformacoes e mantenha mudancas instantaneas ou fades minimos.

## Layout

### Desktop

- Header compacto com identidade do projeto, acoes globais e estado de salvamento.
- Sidebar esquerda para templates, paginas ou camadas.
- Canvas central flexivel com zoom, guias e preview.
- Inspector direito para propriedades do item selecionado.
- Barra inferior opcional para status, zoom e resolucao.

### Mobile

- Canvas/preview em primeiro plano.
- Controles em abas inferiores: Templates, Editar, Estilo, Exportar.
- Painel de propriedades como bottom sheet.
- Toques com alvo minimo de 44px quando a acao for frequente.

## Componentes

Componentes esperados no sistema:

- Botao primario, secundario, ghost, destructive e icon-only.
- Input, textarea, select, checkbox, switch, slider e segmented control.
- Toolbar com grupos visuais estaveis.
- Tabs para modos de edicao.
- Card de template com thumbnail, nome, categoria, estado favorito e menu.
- Empty state com uma acao clara.
- Toasts para feedback nao bloqueante.
- Modal para confirmacoes destrutivas.
- Tooltip para botoes icon-only e controles pouco obvios.

## Estados

Todo componente interativo deve cobrir:

- Default
- Hover
- Focus visible
- Active/pressed
- Selected
- Disabled
- Loading, quando houver operacao assincrona
- Error, quando houver validacao

Focus visible deve ser sempre perceptivel contra superficies claras e escuras.

## Acessibilidade

- Contraste minimo AA: 4.5:1 para texto normal e 3:1 para texto grande ou componentes graficos.
- Nao remova outline sem substituir por foco visivel equivalente.
- Icon buttons precisam de `aria-label`.
- Formularios precisam de labels associadas.
- Drag and drop deve ter alternativa por clique, menu ou teclado.
- Mensagens de erro devem usar texto claro e associacao com o campo.
- Respeite `prefers-reduced-motion`.

## Anti-padroes

- Landing page como tela inicial da ferramenta.
- Paleta dominada por um unico tom.
- Cards dentro de cards.
- Gradientes grandes como substituto de hierarquia.
- Texto explicando o uso da propria UI quando um controle familiar resolveria.
- Layout que muda de tamanho em hover, loading ou selecao.
- Thumbnails sem proporcao fixa.
- Acoes destrutivas com a mesma forca visual de acoes primarias.

## Checklist de Revisao Visual

- [ ] Canvas e preview sao o foco da tela.
- [ ] Controles principais cabem em 375px sem sobrepor texto.
- [ ] Estados hover/focus/disabled/loading existem nos componentes relevantes.
- [ ] Textos longos nao quebram o layout.
- [ ] Selecoes e erros nao dependem apenas de cor.
- [ ] Motion respeita reduced motion.
- [ ] Paleta tem neutros, primario e acento sem ficar monocromatica.
- [ ] Tokens foram usados em vez de valores soltos repetidos.
