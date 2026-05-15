# Design Model

Design Model é um editor web open-source para criar, adaptar e exportar templates visuais de projetos digitais. Ele foi pensado para quem precisa transformar uma ideia em uma tela apresentável rapidamente: dashboards, catálogos, fluxos mobile, propostas e layouts conceituais.

O projeto combina uma biblioteca inicial de templates com um canvas editável, camadas selecionáveis, painel de propriedades, automação local para agentes de IA e exportação em formatos simples para validação ou início de implementação.

## Links

- Demo online: https://design-model-two.vercel.app
- Repositorio: https://github.com/JoseWillians/design-model

## Visao

A visao do Design Model e ser uma ferramenta leve, local-first e extensivel para prototipar estruturas visuais sem friccao. O foco nao e substituir ferramentas profissionais completas, mas entregar um ponto de partida claro para equipes, devs, designers, produto e pequenos negocios alinharem ideias antes de investir em desenvolvimento detalhado.

Principios do produto:

- Templates primeiro: comecar de uma base pronta e editavel.
- Canvas honesto: visualizar a composicao real, com proporcoes e camadas.
- Edicao previsivel: controles diretos para texto, posicao, tamanho e estilo.
- Dados portaveis: exportar JSON e CSS para uso em outros fluxos.
- Open-source por padrao: documentacao clara, contribuicao simples e evolucao incremental.

## Features

- Galeria local de templates iniciais.
- Templates para dashboard, catalogo e fluxo mobile.
- Criação de template em branco para montar uma composição do zero.
- Canvas com zoom, grid visual e selecao por clique ou teclado.
- Manipulacao direta no canvas: arrastar camadas e redimensionar por alcas.
- Snap de grade ativavel e movimento fino por teclado.
- Área de trabalho ampla ao redor do canvas, com scroll para navegação.
- Preset `Área livre` com canvas 2560x1600, comando rápido para expandir o canvas atual e dimensões customizadas até 8192px.
- Botão para enquadrar o canvas automaticamente na área visível.
- Presets de canvas para área livre, desktop, tablet, mobile, square, story e dimensões customizadas.
- Camadas de texto, imagem, formas e grupos.
- Inspector para editar nome, texto, posição, tamanho, cor, borda, opacidade, raio, fonte, peso e alinhamento.
- Edição de URL, texto alternativo e encaixe de imagens.
- Ações rápidas para alinhar camadas ao canvas e alterar ordem visual.
- Edição de fundo e tamanho da grade do canvas.
- Adição de novas camadas de texto, retângulo, elipse e imagem.
- Alternar visibilidade de camadas.
- Bloquear camadas para evitar edicoes acidentais.
- Sidebar esquerda recolhível com controle no próprio painel.
- Atalhos de teclado para alternar snap, bloquear, duplicar e excluir camadas.
- Duplicar e excluir camadas.
- Duplicar, excluir e resetar templates locais.
- Persistencia em `localStorage`.
- Exportacao do template atual em JSON.
- Importacao de JSON exportado pelo app.
- Exportacao de CSS baseado em tokens, canvas e camadas.
- API local `window.designModelAgent` para automações e agentes de IA controlarem o editor.
- Interface React/Vite responsiva para uso em desktop e validacao visual.

## Preview textual

A tela principal e uma area de trabalho em tres zonas:

- Sidebar esquerda: lista de templates e ferramentas para adicionar camadas.
- Centro: canvas com toolbar, zoom, grade visual e preview do template selecionado.
- Sidebar direita: lista de camadas e inspector de propriedades da camada ativa.

Exemplo de fluxo:

1. Escolha um modelo inicial ou clique em "Novo em branco".
2. Adicione texto, retangulos, elipses ou areas de imagem.
3. Selecione uma camada no canvas ou na lista de camadas.
4. Arraste a camada no canvas ou redimensione pelas alcas.
5. Use Snap e setas do teclado para ajustes precisos.
6. Ajuste texto, medidas, cores e estilo no inspector.
7. Recolha a sidebar esquerda pelo próprio painel quando precisar de mais área de edição.
8. Bloqueie camadas que nao devem ser movidas ou editadas.
9. Use `Área livre`, `Enquadrar` ou defina dimensões customizadas de canvas quando os presets não bastarem.
10. Exporte o resultado em JSON ou CSS, e importe JSONs salvos quando quiser continuar.

Atalhos uteis:

- `S`: alterna Snap.
- `L`: bloqueia ou desbloqueia a camada selecionada.
- `Ctrl+D`: duplica a camada selecionada.
- `Delete`: exclui a camada selecionada quando ela nao esta bloqueada.

## Stack

- React 18
- TypeScript
- Vite
- lucide-react
- Playwright instalado como dependencia de desenvolvimento

## Requisitos

- Node.js 20 ou superior recomendado.
- npm 10 ou superior recomendado.

## Instalacao

```bash
npm install
```

## Rodando localmente

```bash
npm run dev
```

Por padrao, o Vite sobe em `http://127.0.0.1:5173`.

## Scripts

```bash
npm run dev
```

Inicia o servidor de desenvolvimento com Vite.

```bash
npm run build
```

Executa typecheck via TypeScript build mode e gera o build de producao em `dist/`.

```bash
npm run typecheck
```

Executa apenas a validacao TypeScript.

```bash
npm run preview
```

Serve localmente o build gerado para conferencia final.

## Arquitetura

```text
src/
  App.tsx                    # Shell principal, canvas, camadas, inspector e acoes
  main.tsx                   # Bootstrap React
  styles.css                 # Estilos globais da interface
  components/
    IconButton.tsx           # Botao com icone e tooltip
    Panel.tsx                # Container reutilizavel de paineis
    PropertyField.tsx        # Campo rotulado do inspector
    TemplateCard.tsx         # Card de selecao de template
  design/
    tokens.ts                # Tokens visuais do app
  lib/
    exporters.ts             # Exportacao JSON/CSS
    layerGeometry.ts         # Snap, clamp, movimento e resize de camadas
    templateFactory.ts       # Criacao de templates em branco
    templateImport.ts        # Validacao e normalizacao de JSON importado
    templateSeed.ts          # Templates iniciais
    templateStore.ts         # Persistencia local e operacoes de template
    templateTypes.ts         # Tipos de templates, canvas, tokens e camadas
```

### Modelo de dados

O nucleo do projeto gira em torno de `TemplateDocument`:

- `metadata`: nome, descricao, categoria, tags, status e datas.
- `canvas`: tamanho, preset, background e grid.
- `tokens`: cores, tipografia, espacos, raios e sombras.
- `layers`: arvore de camadas renderizadas no canvas.

A persistencia atual e local-first, usando a chave `design-model.templates.v1` em `localStorage`.

## Exportacao

O exportador JSON gera o documento completo do template atual, util para backup, integracao futura ou revisao de estrutura.

O exportador CSS gera:

- variaveis CSS a partir dos tokens;
- classe raiz do template com dimensoes e background;
- classes absolutas para cada camada renderizavel.

## Automação por agentes

O editor expõe uma API local no navegador em `window.designModelAgent`. Ela permite selecionar templates, criar camadas, aplicar patches validados, alinhar camadas, ajustar canvas e exportar JSON/CSS sem backend.

Veja [docs/AGENT_API.md](./docs/AGENT_API.md) para o contrato completo.

## Deploy na Vercel

Deploy atual: https://design-model-two.vercel.app

O projeto e uma aplicacao Vite estatica. Para publicar na Vercel:

1. Importe o repositorio na Vercel.
2. Use o preset de Vite ou configure manualmente:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Faca o deploy.

Nao ha variaveis de ambiente obrigatorias no estado atual do projeto.

## Contribuindo

Contribuicoes sao bem-vindas. Leia [CONTRIBUTING.md](./CONTRIBUTING.md) antes de abrir pull requests.

Boas primeiras contribuicoes:

- Melhorar templates iniciais.
- Adicionar testes para exportacao e persistencia.
- Refinar acessibilidade do canvas e inspector.
- Criar importacao de JSON exportado.
- Melhorar responsividade em tablet e mobile.

## Roadmap

O plano publico esta em [ROADMAP.md](./ROADMAP.md). A prioridade atual e estabilizar o MVP: galeria, editor, persistencia local, exportacao e validacao visual.

## Validacao

Antes de enviar mudancas:

```bash
npm run typecheck
npm run build
```

Para mudancas visuais relevantes, rode tambem:

```bash
npm run dev
```

Valide manualmente em desktop e em larguras mobile/tablet.

## Licenca

Distribuido sob a licenca MIT. Consulte [LICENSE](./LICENSE).
