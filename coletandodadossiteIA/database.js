// ============================================================
// database.js — Configuração do Banco de Dados SQLite
// Tabelas: temas, sites, coletas (relacionadas via INNER JOIN)
// ============================================================

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'dados.db');
const db = new Database(DB_PATH);

// Habilita foreign keys no SQLite
db.pragma('foreign_keys = ON');

// ----------------------------------------------------------
// Criação das tabelas
// ----------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS temas (
    id_tema     INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_tema   TEXT NOT NULL UNIQUE,
    descricao   TEXT
  );

  CREATE TABLE IF NOT EXISTS sites (
    id_site     INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_site   TEXT NOT NULL,
    url         TEXT NOT NULL UNIQUE,
    id_tema     INTEGER NOT NULL,
    FOREIGN KEY (id_tema) REFERENCES temas(id_tema)
  );

  CREATE TABLE IF NOT EXISTS coletas (
    id_coleta         INTEGER PRIMARY KEY AUTOINCREMENT,
    id_site           INTEGER NOT NULL,
    titulo_pagina     TEXT,
    quantidade_links  INTEGER DEFAULT 0,
    quantidade_imagens INTEGER DEFAULT 0,
    palavras_chave    TEXT,
    data_coleta       TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (id_site) REFERENCES sites(id_site)
  );
`);

// ----------------------------------------------------------
// Seed: temas padrão de IA (executado apenas se a tabela
// estiver vazia)
// ----------------------------------------------------------
const totalTemas = db.prepare('SELECT COUNT(*) as total FROM temas').get();
if (totalTemas.total === 0) {
    const insertTema = db.prepare(
        'INSERT INTO temas (nome_tema, descricao) VALUES (?, ?)'
    );
    const seedTemas = db.transaction(() => {
        insertTema.run('LLMs', 'Modelos de Linguagem de Grande Escala (GPT, Gemini, Claude...)');
        insertTema.run('Visão Computacional', 'Reconhecimento de imagem, geração visual, DALL-E, Stable Diffusion');
        insertTema.run('Ética em IA', 'Regulação, viés algorítmico, transparência e impacto social');
        insertTema.run('Machine Learning', 'Aprendizado de máquina, redes neurais e algoritmos de treinamento');
        insertTema.run('IA Geral', 'Notícias e tendências gerais sobre Inteligência Artificial');
    });
    seedTemas();
    console.log('[DB] Temas padrão inseridos.');
}

// ----------------------------------------------------------
// Funções exportadas
// ----------------------------------------------------------

/** Retorna todos os temas */
function getTemas() {
    return db.prepare('SELECT * FROM temas ORDER BY nome_tema').all();
}

/** Insere um novo site; lança erro se URL duplicada */
function insertSite({ nome_site, url, id_tema }) {
    const stmt = db.prepare(
        'INSERT INTO sites (nome_site, url, id_tema) VALUES (?, ?, ?)'
    );
    return stmt.run(nome_site, url, id_tema);
}

/** Retorna todos os sites com o nome do tema (INNER JOIN) */
function getSites() {
    return db.prepare(`
    SELECT s.id_site, s.nome_site, s.url, t.nome_tema, t.id_tema
    FROM sites s
    INNER JOIN temas t ON s.id_tema = t.id_tema
    ORDER BY s.id_site DESC
  `).all();
}

/** Retorna um site pelo id */
function getSiteById(id) {
    return db.prepare('SELECT * FROM sites WHERE id_site = ?').get(id);
}

/** Insere uma coleta */
function insertColeta({ id_site, titulo_pagina, quantidade_links, quantidade_imagens, palavras_chave }) {
    const stmt = db.prepare(`
    INSERT INTO coletas (id_site, titulo_pagina, quantidade_links, quantidade_imagens, palavras_chave)
    VALUES (?, ?, ?, ?, ?)
  `);
    return stmt.run(id_site, titulo_pagina, quantidade_links, quantidade_imagens, palavras_chave);
}

/**
 * Consulta principal com INNER JOIN (temas + sites + coletas)
 * Usada no dashboard e no relatório PDF
 */
function getColetasCompletas() {
    return db.prepare(`
    SELECT
      t.nome_tema,
      s.nome_site,
      s.url,
      c.titulo_pagina,
      c.quantidade_links,
      c.quantidade_imagens,
      c.palavras_chave,
      c.data_coleta
    FROM coletas c
    INNER JOIN sites s ON c.id_site = s.id_site
    INNER JOIN temas t ON s.id_tema = t.id_tema
    ORDER BY c.data_coleta DESC
  `).all();
}

/** Estatísticas para o dashboard: contagem por tema */
function getEstatisticasPorTema() {
    return db.prepare(`
    SELECT
      t.nome_tema,
      COUNT(c.id_coleta) AS total_coletas,
      SUM(c.quantidade_links) AS total_links,
      SUM(c.quantidade_imagens) AS total_imagens
    FROM temas t
    INNER JOIN sites s ON s.id_tema = t.id_tema
    INNER JOIN coletas c ON c.id_site = s.id_site
    GROUP BY t.id_tema
    ORDER BY total_coletas DESC
  `).all();
}

module.exports = {
    getTemas,
    insertSite,
    getSites,
    getSiteById,
    insertColeta,
    getColetasCompletas,
    getEstatisticasPorTema,
};