import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, addDoc, deleteDoc, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { setLogLevel } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// Ativar logging para debug
setLogLevel('debug');

// ==========================
// Configuração do Firebase
// ==========================
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const userIdDisplay = document.getElementById('user-id');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let userId = null;

// ==========================
// Autenticação
// ==========================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
        userIdDisplay.textContent = userId;
        console.log("Usuário autenticado:", userId);
        startApp();
    } else {
        userId = null;
        userIdDisplay.textContent = 'N/A';
        console.log("Nenhum usuário logado. Tentando autenticação...");
        try {
            if (typeof __initial_auth_token !== 'undefined') {
                await signInWithCustomToken(auth, __initial_auth_token);
                console.log("Autenticação com token personalizada bem-sucedida.");
            } else {
                await signInAnonymously(auth);
                console.log("Autenticação anônima bem-sucedida.");
            }
        } catch (error) {
            console.error("Erro na autenticação:", error);
            showModal("Erro de autenticação: " + error.message, false);
        }
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("Usuário desconectado.");
    }).catch((error) => {
        console.error("Erro ao fazer logout:", error);
    });
});

// ==========================
// Elementos e Utilidades
// ==========================
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const hojeISO = () => new Date().toISOString().slice(0, 10);
const yyyymm = (isoDate) => (isoDate || '').slice(0, 7);
const form = document.getElementById('transacao-form');
const inputData = document.getElementById('data');
const tabelaCorpo = document.getElementById('tabela-corpo');
const filtroMes = document.getElementById('filtro-mes');
const kpiEntradas = document.getElementById('kpi-entradas');
const kpiSaidas = document.getElementById('kpi-saidas');
const kpiSaldo = document.getElementById('kpi-saldo');
const graficoMensalCtx = document.getElementById('graficoFinanceiro').getContext('2d');
const tabelaAnualCorpo = document.getElementById('tabela-anual').querySelector('tbody');
const totalEntradasAnual = document.getElementById('total-entradas-anual');
const totalSaidasAnual = document.getElementById('total-saidas-anual');
const saldoAnual = document.getElementById('saldo-anual');
const formFornecedor = document.getElementById('fornecedor-form');
const listaFornecedores = document.getElementById('lista-fornecedores');
const inputNovoFornecedor = document.getElementById('novo-fornecedor');
const btnImprimirMensal = document.getElementById('btn-imprimir-mensal');
const btnImprimirAnual = document.getElementById('btn-imprimir-anual');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitulo = document.getElementById('modal-titulo');
const modalMensagem = document.getElementById('modal-mensagem');
const modalBtnConfirmar = document.getElementById('modal-btn-confirmar');
const modalBtnCancelar = document.getElementById('modal-btn-cancelar');
const loadingSpinner = document.getElementById('loading-spinner');

let transacoes = [];
let fornecedores = [];
let graficoMensal;
let graficoAnual;

// ==========================
// Funções de UI
// ==========================
function showLoadingSpinner() {
    loadingSpinner.classList.add('active');
}

function hideLoadingSpinner() {
    loadingSpinner.classList.remove('active');
}

function showModal(message, isConfirm = false, onConfirm = null) {
    modalMensagem.textContent = message;
    modalBtnConfirmar.style.display = isConfirm ? 'inline-block' : 'none';
    modalBtnCancelar.style.display = isConfirm ? 'inline-block' : 'none';
    modalOverlay.classList.add('active');

    modalBtnConfirmar.onclick = () => {
        if (onConfirm) onConfirm();
        hideModal();
    };
    modalBtnCancelar.onclick = () => {
        hideModal();
    };
}

function hideModal() {
    modalOverlay.classList.remove('active');
}

// ==========================
// Funções Firestore
// ==========================
const getTransacoesCollection = () => collection(db, `artifacts/${appId}/users/${userId}/transacoes`);
const getFornecedoresCollection = () => collection(db, `artifacts/${appId}/users/${userId}/fornecedores`);

async function salvarTransacao(transacao) {
    try {
        await addDoc(getTransacoesCollection(), transacao);
        showModal("Lançamento salvo com sucesso!");
    } catch (e) {
        showModal("Erro ao salvar lançamento: " + e.message, false);
    }
}

async function excluirTransacao(id) {
    showModal("Tem certeza que deseja excluir esta transação?", true, async () => {
        try {
            await deleteDoc(doc(getTransacoesCollection(), id));
            showModal("Lançamento excluído com sucesso!");
        } catch (e) {
            showModal("Erro ao excluir lançamento: " + e.message, false);
        }
    });
}

async function salvarFornecedor(nome) {
    try {
        await addDoc(getFornecedoresCollection(), { nome });
        inputNovoFornecedor.value = '';
    } catch (e) {
        showModal("Erro ao salvar fornecedor: " + e.message, false);
    }
}

async function excluirFornecedor(id) {
    showModal("Tem certeza que deseja excluir este fornecedor?", true, async () => {
        try {
            await deleteDoc(doc(getFornecedoresCollection(), id));
            showModal("Fornecedor excluído com sucesso!");
        } catch (e) {
            showModal("Erro ao excluir fornecedor: " + e.message, false);
        }
    });
}

// ==========================
// Funções de Impressão
// ==========================
function handlePrint(sectionId) {
    showModal("Deseja imprimir este relatório?", true, () => {
        const sectionsToHide = document.querySelectorAll('main > section:not(#' + sectionId + ')');
        const originalDisplay = [];
        
        // Esconder seções não relacionadas
        sectionsToHide.forEach(section => {
            originalDisplay.push(section.style.display);
            section.style.display = 'none';
        });

        // Esconder o botão de imprimir
        document.querySelector(`#${sectionId} .imprimir-botoes`).style.display = 'none';
        
        // Adicionar um pequeno atraso para o navegador processar as mudanças de estilo
        setTimeout(() => {
            window.print();
        }, 100);

        // Ocultar modal de confirmação
        hideModal();

        // Restaurar seções após a impressão
        window.addEventListener('afterprint', () => {
            sectionsToHide.forEach((section, index) => {
                section.style.display = originalDisplay[index];
            });
            document.querySelector(`#${sectionId} .imprimir-botoes`).style.display = '';
        });
    });
}

// ==========================
// Funções de Renderização
// ==========================
function atualizarInterface() {
    const alvoMes = filtroMes.value;
    const lista = transacoes.filter(t => yyyymm(t.data) === alvoMes);

    tabelaCorpo.innerHTML = '';
    let totalEntradas = 0, totalSaidas = 0;

    lista.sort((a, b) => a.data.localeCompare(b.data));
    lista.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
            <td>${t.descricao}</td>
            <td>${t.fornecedor || '-'}</td>
            <td>${BRL.format(t.valor)}</td>
            <td class="${t.tipo}">${t.tipo}</td>
            <td><button class="excluir" data-id="${t.id}">Excluir</button></td>
        `;
        tabelaCorpo.appendChild(tr);
        if (t.tipo === 'entrada') totalEntradas += t.valor;
        else totalSaidas += t.valor;
    });

    const saldo = totalEntradas - totalSaidas;
    kpiEntradas.textContent = BRL.format(totalEntradas);
    kpiSaidas.textContent = BRL.format(totalSaidas);
    kpiSaldo.textContent = BRL.format(saldo);

    atualizarGraficoMensal(lista);
    renderizarTabelaAnual();
    renderizarFornecedores();
}

function atualizarGraficoMensal(lista) {
    if (graficoMensal) graficoMensal.destroy();
    const entradas = lista.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0);
    const saidas = lista.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0);

    graficoMensal = new Chart(graficoMensalCtx, {
        type: 'bar',
        data: {
            labels: ['Entradas', 'Saídas'],
            datasets: [{
                label: 'Valores Mensais',
                data: [entradas, saidas],
                backgroundColor: ['#1e8e3e', '#d93025'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderizarTabelaAnual() {
    const dadosAnuais = {};
    let totalEntradasAnualCalc = 0, totalSaidasAnualCalc = 0;

    transacoes.forEach(t => {
        const mesAno = yyyymm(t.data);
        if (!dadosAnuais[mesAno]) {
            dadosAnuais[mesAno] = { entradas: 0, saidas: 0 };
        }
        if (t.tipo === 'entrada') {
            dadosAnuais[mesAno].entradas += t.valor;
            totalEntradasAnualCalc += t.valor;
        } else {
            dadosAnuais[mesAno].saidas += t.valor;
            totalSaidasAnualCalc += t.valor;
        }
    });

    tabelaAnualCorpo.innerHTML = '';
    const meses = Object.keys(dadosAnuais).sort();
    meses.forEach(mesAno => {
        const dados = dadosAnuais[mesAno];
        const saldo = dados.entradas - dados.saidas;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${mesAno}</td>
            <td>${BRL.format(dados.entradas)}</td>
            <td>${BRL.format(dados.saidas)}</td>
            <td>${BRL.format(saldo)}</td>
        `;
        tabelaAnualCorpo.appendChild(tr);
    });

    totalEntradasAnual.textContent = BRL.format(totalEntradasAnualCalc);
    totalSaidasAnual.textContent = BRL.format(totalSaidasAnualCalc);
    saldoAnual.textContent = BRL.format(totalEntradasAnualCalc - totalSaidasAnualCalc);

    atualizarGraficoAnual(dadosAnuais);
}

function atualizarGraficoAnual(dadosAnuais) {
    if (graficoAnual) graficoAnual.destroy();
    const meses = Object.keys(dadosAnuais).sort();
    const entradas = meses.map(m => dadosAnuais[m].entradas);
    const saidas = meses.map(m => dadosAnuais[m].saidas);

    graficoAnual = new Chart(document.getElementById('graficoAnual').getContext('2d'), {
        type: 'line',
        data: {
            labels: meses,
            datasets: [{
                label: 'Entradas',
                data: entradas,
                borderColor: '#1e8e3e',
                fill: false,
                tension: 0.1
            }, {
                label: 'Saídas',
                data: saidas,
                borderColor: '#d93025',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderizarFornecedores() {
    listaFornecedores.innerHTML = '';
    fornecedores.forEach(f => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${f.nome}</span><button class="remover" data-id="${f.id}">Remover</button>`;
        listaFornecedores.appendChild(li);
    });
}

// ==========================
// Listeners e Inicialização
// ==========================
function startApp() {
    inputData.value = hojeISO();
    filtroMes.value = yyyymm(hojeISO());

    onSnapshot(query(getTransacoesCollection()), (querySnapshot) => {
        transacoes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        atualizarInterface();
    });

    onSnapshot(query(getFornecedoresCollection()), (querySnapshot) => {
        fornecedores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarFornecedores();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const transacao = {
            descricao: document.getElementById('descricao').value,
            valor: parseFloat(document.getElementById('valor').value),
            tipo: document.getElementById('tipo').value,
            data: document.getElementById('data').value,
            fornecedor: document.getElementById('fornecedor').value || null
        };
        salvarTransacao(transacao);
        form.reset();
    });

    formFornecedor.addEventListener('submit', (e) => {
        e.preventDefault();
        salvarFornecedor(inputNovoFornecedor.value);
    });

    tabelaCorpo.addEventListener('click', (e) => {
        if (e.target.classList.contains('excluir')) {
            excluirTransacao(e.target.dataset.id);
        }
    });

    listaFornecedores.addEventListener('click', (e) => {
        if (e.target.classList.contains('remover')) {
            excluirFornecedor(e.target.dataset.id);
        }
    });

    filtroMes.addEventListener('change', atualizarInterface);

    btnImprimirMensal.addEventListener('click', () => handlePrint('relatorio-section'));
    btnImprimirAnual.addEventListener('click', () => handlePrint('relatorio-anual-section'));

    // Fechar modal ao clicar no overlay
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        hideModal();
      }
    });
}



