# 🤖 Sistema IA — Coleta, Análise e Visualização de Dados

> Projeto escolar de sistema web para monitoramento automático do ecossistema de Inteligência Artificial, desenvolvido com Node.js, Express, SQLite e JavaScript Vanilla.

---

## 📌 Sobre o Projeto

O **Sistema IA** resolve um problema prático de quem acompanha o universo de Inteligência Artificial: a necessidade de visitar manualmente dezenas de sites, blogs e portais para se manter atualizado.

Com o sistema, o usuário cadastra suas fontes de pesquisa uma única vez e, a partir daí, pode disparar coletas automáticas com um clique. O sistema acessa cada site, extrai informações relevantes, identifica palavras-chave do ecossistema de IA (como `GPT-4`, `LLM`, `Stable Diffusion`, `Claude`, `TensorFlow`, entre outras) e armazena tudo em banco de dados local para consulta e geração de relatórios.

---

## 🚀 Como Abrir o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior instalado
- Terminal (Bash, PowerShell ou CMD)

### Passo a passo

**1. Clone ou baixe o projeto e entre na pasta:**
```bash
cd sistema-ia
```

**2. Instale as dependências:**
```bash
npm install
```
⚠️ **OBS:***siga as instruções dentro do .env.example que está presente na raiz do diretório para melhor funcionamento do nosso sistema no seu ambiente.*

**3. Inicie o servidor:**
```bash
node server.js
```

**4. Acesse no navegador:**
```
http://localhost:3000
```

> O banco de dados `dados.db` é criado automaticamente na primeira execução, já com as categorias de IA pré-cadastradas.

---

## 🗂️ Estrutura de Arquivos

```
sistema-ia/
│
├── server.js        → Servidor Express: rotas GET, POST e geração de PDF
├── database.js      → Configuração do SQLite e todas as funções de banco
├── scraper.js       → Coleta com Axios + Cheerio + Regex de keywords de IA
│
├── index.html       → Interface principal (SPA com navegação por seções)
├── app.js           → Lógica do front-end: Fetch API, DOM e Chart.js
├── style.css        → Estilização completa da interface
│
├── dados.db         → Banco de dados SQLite (gerado automaticamente)
└── package.json     → Dependências do projeto
```

---

## 🧩 Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 📊 **Dashboard** | Cards de estatísticas e gráfico de barras por categoria de IA |
| ➕ **Cadastrar Site** | Formulário com validação de URL em tempo real via Regex |
| 🔍 **Coletar Dados** | Dispara scraping automático no site selecionado |
| 📋 **Ver Coletas** | Tabela com histórico completo de todas as coletas realizadas |
| 📄 **Relatório PDF** | Gera e baixa um relatório completo com todos os dados coletados |

---

## 🗄️ Banco de Dados

O sistema utiliza **SQLite** com três tabelas relacionadas entre si:

```
temas          sites              coletas
─────────      ──────────         ──────────────────
id_tema    ←── id_tema            id_coleta
nome_tema       id_site       ←── id_site
descricao       nome_site         titulo_pagina
                url               quantidade_links
                                  quantidade_imagens
                                  palavras_chave
                                  data_coleta
```

As consultas utilizam `INNER JOIN` para cruzar dados das três tabelas, exibindo informações completas como tema, site de origem, título coletado e métricas juntos em uma única consulta.

**Categorias pré-cadastradas:**
- LLMs *(GPT, Gemini, Claude...)*
- Visão Computacional *(DALL-E, Stable Diffusion...)*
- Ética em IA
- Machine Learning
- IA Geral

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Função |
|---|---|---|
| Servidor | Node.js + Express.js | Rotas GET/POST e entrega do frontend |
| Scraping | Axios | Requisições HTTP às páginas externas |
| Parsing | Cheerio | Extração de título, links e imagens do HTML |
| Validação | Regex | Validação de URLs e extração de keywords de IA |
| Banco de Dados | SQLite (better-sqlite3) | Persistência local com INNER JOIN |
| Interface | HTML + CSS + JS Vanilla | Manipulação de DOM e navegação entre seções |
| Gráficos | Chart.js | Gráfico de barras no dashboard |
| PDF | PDFKit | Geração de relatório para download |
| Comunicação | CORS | Permite comunicação entre front-end e back-end |

---

## 🔌 Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Serve o `index.html` |
| `GET` | `/api/temas` | Lista todas as categorias de IA |
| `GET` | `/api/sites` | Lista todos os sites cadastrados |
| `GET` | `/api/coletas` | Lista o histórico completo de coletas |
| `GET` | `/api/dashboard` | Retorna estatísticas agregadas por tema |
| `GET` | `/api/validar-url` | Valida uma URL via Regex |
| `GET` | `/api/relatorio` | Gera e retorna o relatório em PDF |
| `POST` | `/api/sites` | Cadastra um novo site |
| `POST` | `/api/coletar` | Inicia a coleta de dados de um site |

---

## 🔍 Como o Scraper Funciona

1. O usuário seleciona um site cadastrado e clica em **Coletar Agora**
2. O back-end valida a URL com Regex e acessa a página via **Axios**
3. O **Cheerio** faz o parsing do HTML e extrai:
   - Título da página (`<title>`)
   - Contagem de links (`<a href>`)
   - Contagem de imagens (`<img>`)
   - Texto completo do `<body>` para análise de keywords
4. Um **Regex especializado** varre o texto buscando termos do ecossistema de IA
5. Os dados são salvos no banco e exibidos imediatamente na tela

**Exemplo de keywords detectadas automaticamente:**
`gpt-4`, `llm`, `stable diffusion`, `claude`, `tensorflow`, `pytorch`, `langchain`, `embeddings`, `fine-tuning`, `multimodal`...

---

## ⚠️ Observações

- O scraper pode ser bloqueado por sites que utilizam proteção anti-bot ou carregamento via JavaScript (SPAs). Prefira sites com conteúdo HTML estático.
- O arquivo `dados.db` é local. Não é necessário configurar nenhum servidor de banco de dados externo.
- A porta padrão é `3000`. Caso esteja em uso, altere a constante `PORT` no `server.js`.

---

## 👥 Projeto Escolar

Desenvolvido como trabalho prático da disciplina de Desenvolvimento Web.
Tema: **Inteligência Artificial** · Ano: 2025
