// ============================================================
// app.js — Lógica do Front-end (DOM + Fetch API + Chart.js)
// ============================================================

const API = 'http://localhost:3000/api';
let grafico = null; // Instância do Chart.js (evita duplicatas)

// ----------------------------------------------------------
// Inicialização
// ----------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    carregarTemas();
    carregarSitesParaColeta();
    carregarDashboard();
    carregarColetas();

    // Validação de URL em tempo real (Regex no front)
    const inputURL = document.getElementById('url_site');
    const msgValidacao = document.getElementById('url-validacao');
    const REGEX_URL_FRONT = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)$/i;

    inputURL.addEventListener('input', () => {
        const url = inputURL.value.trim();
        if (!url) { limparValidacao(inputURL, msgValidacao); return; }

        if (REGEX_URL_FRONT.test(url)) {
            inputURL.className = 'valida';
            msgValidacao.textContent = '✔ URL válida';
            msgValidacao.className = 'validacao-msg ok';
        } else {
            inputURL.className = 'invalida';
            msgValidacao.textContent = '✘ URL inválida (use https://...)';
            msgValidacao.className = 'validacao-msg err';
        }
    });
});

function limparValidacao(input, span) {
    input.className = '';
    span.textContent = '';
    span.className = 'validacao-msg';
}

// ----------------------------------------------------------
// Navegação entre seções
// ----------------------------------------------------------
function mostrarSecao(id, event) {

    // remove ativa das seções
    document.querySelectorAll('.secao').forEach(secao => {
        secao.classList.remove('ativa');
    });

    // ativa nova seção
    const secaoAtiva = document.getElementById(id);
    secaoAtiva.classList.add('ativa');

    // remove active dos botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // ativa botão clicado
    event.currentTarget.classList.add('active');

    // =========================
    // ANIMAÇÃO
    // =========================

    gsap.from(secaoAtiva, {
        opacity: 0,
        y: -20,
        duration: 0.8
    });

}

// ----------------------------------------------------------
// Dashboard
// ----------------------------------------------------------
async function carregarDashboard() {
    try {
        const res = await fetch(`${API}/dashboard`);
        const json = await res.json();
        const stats = json.dados;

        const container = document.getElementById('cards-stats');
        const cores = ['', 'cor-verde', 'cor-roxo', 'cor-laranja'];

        if (!stats || stats.length === 0) {
            container.innerHTML = '<p class="loading">Nenhuma coleta realizada ainda. Cadastre um site e colete dados! 🚀</p>';
            return;
        }

        container.innerHTML = stats.map((s, i) => `
      <div class="card-stat ${cores[i % cores.length]}">
        <h3>${s.nome_tema}</h3>
        <div class="valor-grande">${s.total_coletas}</div>
        <div class="detalhe">🔗 ${s.total_links} links &nbsp;|&nbsp; 🖼 ${s.total_imagens} imagens</div>
      </div>
    `).join('');

        renderizarGrafico(stats);
    } catch (err) {
        document.getElementById('cards-stats').innerHTML = `<p class="loading">Erro ao carregar dashboard.</p>`;
        console.error(err);
    }
}

function renderizarGrafico(stats) {
    const ctx = document.getElementById('graficoBarras').getContext('2d');

    if (grafico) grafico.destroy(); // Evita duplicata de canvas

    grafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.map(s => s.nome_tema),
            datasets: [{
                label: 'Número de Coletas',
                data: stats.map(s => s.total_coletas),
                backgroundColor: ['#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#0891b2'],
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: false },
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ----------------------------------------------------------
// Temas (para o select de cadastro)
// ----------------------------------------------------------
async function carregarTemas() {
    try {
        const res = await fetch(`${API}/temas`);
        const json = await res.json();
        const select = document.getElementById('id_tema');
        select.innerHTML = '<option value="">Selecione uma categoria...</option>' +
            json.dados.map(t => `<option value="${t.id_tema}">${t.nome_tema}</option>`).join('');
    } catch (err) {
        console.error('Erro ao carregar temas:', err);
    }
}

// ----------------------------------------------------------
// Cadastrar Site
// ----------------------------------------------------------
async function cadastrarSite() {
    const nome_site = document.getElementById('nome_site').value.trim();
    const url = document.getElementById('url_site').value.trim();
    const id_tema = document.getElementById('id_tema').value;
    const msg = document.getElementById('msg-cadastro');

    msg.className = 'msg';
    msg.textContent = '';

    if (!nome_site || !url || !id_tema) {
        exibirMsg(msg, '⚠ Preencha todos os campos.', 'erro');
        return;
    }

    try {
        const res = await fetch(`${API}/sites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_site, url, id_tema: Number(id_tema) }),
        });
        const json = await res.json();

        if (json.sucesso) {
            exibirMsg(msg, `✅ Site cadastrado com sucesso! (ID: ${json.id})`, 'sucesso');
            document.getElementById('nome_site').value = '';
            document.getElementById('url_site').value = '';
            document.getElementById('id_tema').value = '';
            carregarSitesParaColeta();
        } else {
            exibirMsg(msg, `❌ ${json.erro}`, 'erro');
        }
    } catch (err) {
        exibirMsg(msg, '❌ Erro de conexão com o servidor.', 'erro');
    }
}

// ----------------------------------------------------------
// Coleta
// ----------------------------------------------------------
async function carregarSitesParaColeta() {
    try {
        const res = await fetch(`${API}/sites`);
        const json = await res.json();
        const select = document.getElementById('site-coletar');
        if (!json.dados || json.dados.length === 0) {
            select.innerHTML = '<option value="">Nenhum site cadastrado ainda</option>';
            return;
        }
        select.innerHTML = '<option value="">Selecione um site...</option>' +
            json.dados.map(s => `<option value="${s.id_site}">[${s.nome_tema}] ${s.nome_site}</option>`).join('');
    } catch (err) {
        console.error('Erro ao carregar sites:', err);
    }
}

async function iniciarColeta() {
    const id_site = document.getElementById('site-coletar').value;
    const msg = document.getElementById('msg-coleta');
    const resultado = document.getElementById('resultado-coleta');
    const btn = document.querySelector('#coletar .btn-primario');

    msg.className = 'msg';
    resultado.style.display = 'none';

    if (!id_site) {
        exibirMsg(msg, '⚠ Selecione um site para coletar.', 'erro');
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Coletando...';

    try {
        const res = await fetch(`${API}/coletar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_site: Number(id_site) }),
        });
        const json = await res.json();

        if (json.sucesso) {
            exibirMsg(msg, `✅ ${json.mensagem}`, 'sucesso');
            const d = json.dados;
            resultado.innerHTML = `
        <strong>📄 Título:</strong> ${d.titulo_pagina}<br>
        <strong>🔗 Links encontrados:</strong> ${d.quantidade_links}<br>
        <strong>🖼 Imagens encontradas:</strong> ${d.quantidade_imagens}<br>
        <strong>🤖 Keywords de IA:</strong> ${d.palavras_chave}
      `;
            resultado.style.display = 'block';
        } else {
            exibirMsg(msg, `❌ ${json.erro}`, 'erro');
        }
    } catch (err) {
        exibirMsg(msg, '❌ Erro de conexão com o servidor.', 'erro');
    } finally {
        btn.disabled = false;
        btn.textContent = '🚀 Coletar Agora';
    }
}

// ----------------------------------------------------------
// Ver Coletas (tabela com INNER JOIN)
// ----------------------------------------------------------
async function carregarColetas() {
    try {
        const res = await fetch(`${API}/coletas`);
        const json = await res.json();
        const tbody = document.getElementById('tbody-coletas');

        if (!json.dados || json.dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Nenhuma coleta realizada ainda.</td></tr>';
            return;
        }

        tbody.innerHTML = json.dados.map(c => `
      <tr>
        <td><strong>${c.nome_tema}</strong></td>
        <td>${c.nome_site}</td>
        <td>${c.titulo_pagina}</td>
        <td style="text-align:center">${c.quantidade_links}</td>
        <td style="text-align:center">${c.quantidade_imagens}</td>
        <td class="keywords">${c.palavras_chave}</td>
        <td style="white-space:nowrap">${c.data_coleta}</td>
      </tr>
    `).join('');
    } catch (err) {
        document.getElementById('tbody-coletas').innerHTML =
            '<tr><td colspan="7" class="loading">Erro ao carregar coletas.</td></tr>';
    }
}

// ----------------------------------------------------------
// Baixar PDF
// ----------------------------------------------------------
function baixarPDF() {
    window.open(`${API}/relatorio`, '_blank');
}

// ----------------------------------------------------------
// Utilitário
// ----------------------------------------------------------
function exibirMsg(el, texto, tipo) {
    el.textContent = texto;
    el.className = `msg ${tipo}`;
}