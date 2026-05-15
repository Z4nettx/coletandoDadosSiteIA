// ============================================================
// scraper.js — Coleta de Dados com Axios + Cheerio + Regex
// ============================================================

const axios = require('axios');
const cheerio = require('cheerio');

// ----------------------------------------------------------
// REGEX: Validação e Extração
// ----------------------------------------------------------

/** Valida se a string é uma URL válida (http ou https) */
const REGEX_URL = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)$/i;

/**
 * Palavras-chave relacionadas a IA para filtragem.
 * Captura variações como: GPT-4, GPT4, gpt4o, LLM, llms...
 */
const REGEX_KEYWORDS_IA = /\b(gpt-?[0-9o]+|chatgpt|gemini|claude|llm|llms?|stable[ -]diffusion|dall-?e|midjourney|copilot|tensorflow|pytorch|neural[ -]?network|machine[ -]?learning|deep[ -]?learning|computer[ -]?vision|natural[ -]?language|nlp|bert|transformer|generative[ -]?ai|artificial[ -]?intelligence|intelig[eê]ncia[ -]?artificial|openai|anthropic|hugging[ -]?face|langchain|rag|fine[ -]?tun|embeddings?|diffusion[ -]?model|vision[ -]?model|foundation[ -]?model|multimodal)\b/gi;

/**
 * Valida uma URL usando o Regex definido acima.
 * @param {string} url
 * @returns {boolean}
 */
function validarURL(url) {
    return REGEX_URL.test(url.trim());
}

/**
 * Extrai palavras-chave de IA únicas de um texto.
 * @param {string} texto
 * @returns {string} — palavras separadas por vírgula
 */
function extrairKeywordsIA(texto) {
    const encontradas = texto.match(REGEX_KEYWORDS_IA) || [];
    // Normaliza para lowercase e remove duplicatas
    const unicas = [...new Set(encontradas.map(k => k.toLowerCase().trim()))];
    return unicas.slice(0, 15).join(', '); // Máximo de 15 keywords
}

// ----------------------------------------------------------
// Função principal de scraping
// ----------------------------------------------------------

/**
 * Acessa uma URL e extrai:
 * - Título da página
 * - Quantidade de links <a>
 * - Quantidade de imagens <img>
 * - Palavras-chave de IA encontradas no conteúdo
 *
 * @param {string} url
 * @returns {Promise<object>}
 */
async function coletar(url) {
    if (!validarURL(url)) {
        throw new Error(`URL inválida: ${url}`);
    }

    const response = await axios.get(url, {
        timeout: 10000, // 10 segundos
        headers: {
            // Simula um navegador real para evitar bloqueios
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
        },
    });

    const $ = cheerio.load(response.data);

    // Extrai o título da página
    const titulo = $('title').first().text().trim() || 'Sem título';

    // Conta todos os links e imagens
    const quantidadeLinks = $('a[href]').length;
    const quantidadeImagens = $('img').length;

    // Coleta todo o texto visível da página para análise de keywords
    const textoCompleto = $('body').text();
    const keywordsIA = extrairKeywordsIA(textoCompleto);

    return {
        titulo_pagina: titulo.substring(0, 255), // Limita o tamanho
        quantidade_links: quantidadeLinks,
        quantidade_imagens: quantidadeImagens,
        palavras_chave: keywordsIA || 'Nenhuma keyword de IA encontrada',
    };
}

module.exports = { coletar, validarURL, extrairKeywordsIA };