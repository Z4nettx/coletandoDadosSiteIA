// ============================================================
// server.js — Servidor Express com CORS, Rotas e PDF
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const PDFDocument = require('pdfkit');

const OpenAI = require('openai');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
});

app.post('/chat', async (req, res) => {

    try {

        const { mensagem } = req.body;

        const resposta = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',

            messages: [
                {
                    role: 'user',
                    content: mensagem
                }
            ]
        });

        res.json({
            resposta: resposta.choices[0].message.content
        });

    } catch (erro) {

        console.log(erro);

        res.status(500).json({
            erro: 'Erro ao gerar resposta'
        });
    }

});


const db = require('./database');
const { coletar, validarURL } = require('./scraper');

const PORT = 3000;

// ----------------------------------------------------------
// Middlewares
// ----------------------------------------------------------
app.use(cors()); // Permite comunicação entre front-end e back-end
app.use(express.json()); // Parseia JSON no corpo das requisições
app.use(express.static(path.join(__dirname))); // Serve arquivos estáticos da raiz do projeto

// Rota raiz explícita: garante que GET / sempre entregue o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ----------------------------------------------------------
// ROTAS GET
// ----------------------------------------------------------

/** GET /api/temas — Retorna todas as categorias de IA */
app.get('/api/temas', (req, res) => {
    try {
        const temas = db.getTemas();
        res.json({ sucesso: true, dados: temas });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
});

/** GET /api/sites — Retorna todos os sites cadastrados (com INNER JOIN) */
app.get('/api/sites', (req, res) => {
    try {
        const sites = db.getSites();
        res.json({ sucesso: true, dados: sites });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
});

/** GET /api/coletas — Retorna todas as coletas com dados cruzados (INNER JOIN) */
app.get('/api/coletas', (req, res) => {
    try {
        const coletas = db.getColetasCompletas();
        res.json({ sucesso: true, dados: coletas });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
});

/** GET /api/dashboard — Retorna estatísticas agregadas por tema */
app.get('/api/dashboard', (req, res) => {
    try {
        const stats = db.getEstatisticasPorTema();
        res.json({ sucesso: true, dados: stats });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
});

/** GET /api/validar-url?url=... — Valida uma URL via Regex */
app.get('/api/validar-url', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ sucesso: false, erro: 'Parâmetro url é obrigatório.' });
    res.json({ sucesso: true, valida: validarURL(url) });
});

// ----------------------------------------------------------
// ROTAS POST
// ----------------------------------------------------------

/** POST /api/sites — Cadastra um novo site */
app.post('/api/sites', (req, res) => {
    const { nome_site, url, id_tema } = req.body;

    if (!nome_site || !url || !id_tema) {
        return res.status(400).json({ sucesso: false, erro: 'Campos obrigatórios: nome_site, url, id_tema.' });
    }

    if (!validarURL(url)) {
        return res.status(400).json({ sucesso: false, erro: 'URL inválida. Use http:// ou https://.' });
    }

    try {
        const resultado = db.insertSite({ nome_site, url, id_tema });
        res.status(201).json({ sucesso: true, id: resultado.lastInsertRowid });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ sucesso: false, erro: 'Essa URL já foi cadastrada.' });
        }
        res.status(500).json({ sucesso: false, erro: err.message });
    }
});

/** POST /api/coletar — Inicia a coleta de dados de um site cadastrado */
app.post('/api/coletar', async (req, res) => {
    const { id_site } = req.body;

    if (!id_site) {
        return res.status(400).json({ sucesso: false, erro: 'Campo obrigatório: id_site.' });
    }

    const site = db.getSiteById(id_site);
    if (!site) {
        return res.status(404).json({ sucesso: false, erro: 'Site não encontrado.' });
    }

    try {
        console.log(`[SCRAPER] Coletando: ${site.url}`);
        const dados = await coletar(site.url);

        db.insertColeta({ id_site, ...dados });

        res.json({
            sucesso: true,
            mensagem: `Coleta realizada com sucesso para "${site.nome_site}"`,
            dados,
        });
    } catch (err) {
        console.error('[SCRAPER ERRO]', err.message);
        res.status(500).json({ sucesso: false, erro: `Falha na coleta: ${err.message}` });
    }
});

// ----------------------------------------------------------
// ROTA PDF — Gera relatório completo
// ----------------------------------------------------------

/** GET /api/relatorio — Gera e retorna o relatório em PDF */
app.get('/api/relatorio', (req, res) => {
    try {
        const coletas = db.getColetasCompletas();
        const stats = db.getEstatisticasPorTema();

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-ia.pdf"');
        doc.pipe(res);

        // ---- Cabeçalho ----
        doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Sistema de Coleta e Análise de IA', { align: 'center' });

        doc
            .fontSize(11)
            .font('Helvetica')
            .text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });

        doc.moveDown(1.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        // ---- Estatísticas por Tema ----
        doc.fontSize(14).font('Helvetica-Bold').text('Resumo por Categoria de IA');
        doc.moveDown(0.5);

        if (stats.length === 0) {
            doc.fontSize(11).font('Helvetica').text('Nenhuma coleta registrada ainda.');
        } else {
            stats.forEach((s) => {
                doc
                    .fontSize(11)
                    .font('Helvetica-Bold')
                    .text(`• ${s.nome_tema}`, { continued: false });
                doc
                    .fontSize(10)
                    .font('Helvetica')
                    .text(
                        `  Coletas: ${s.total_coletas} | Links: ${s.total_links} | Imagens: ${s.total_imagens}`,
                        { indent: 15 }
                    );
                doc.moveDown(0.3);
            });
        }

        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        // ---- Coletas Detalhadas ----
        doc.fontSize(14).font('Helvetica-Bold').text('Coletas Detalhadas');
        doc.moveDown(0.5);

        if (coletas.length === 0) {
            doc.fontSize(11).font('Helvetica').text('Nenhuma coleta disponível.');
        } else {
            coletas.forEach((c, i) => {
                // Verifica se precisa de nova página
                if (doc.y > 700) doc.addPage();

                doc.fontSize(11).font('Helvetica-Bold').text(`${i + 1}. ${c.titulo_pagina}`);
                doc.fontSize(9).font('Helvetica').fillColor('#555555').text(`Tema: ${c.nome_tema} | Site: ${c.nome_site}`);
                doc.text(`URL: ${c.url}`);
                doc.text(`Links: ${c.quantidade_links} | Imagens: ${c.quantidade_imagens} | Data: ${c.data_coleta}`);
                doc.text(`Keywords IA: ${c.palavras_chave}`);
                doc.fillColor('#000000').moveDown(0.8);
            });
        }

        // ---- Rodapé ----
        doc.moveDown(1);
        doc.fontSize(9).fillColor('#888888').text(
            'Documento gerado automaticamente pelo Sistema de IA — Trabalho Escolar',
            { align: 'center' }
        );

        doc.end();
    } catch (err) {
        console.error('[PDF ERRO]', err.message);
        res.status(500).json({ sucesso: false, erro: err.message });
    }
});

// ----------------------------------------------------------
// Inicialização
// ----------------------------------------------------------
app.listen(PORT, () => {
    console.log(`\n✅ Servidor rodando em http://localhost:${PORT}`);
    console.log(`   Dashboard: http://localhost:${PORT}/index.html`);
    console.log(`   Relatório PDF: http://localhost:${PORT}/api/relatorio\n`);
});