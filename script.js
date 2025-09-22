import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, addDoc, deleteDoc, query } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ==========================
// Configuração do Firebase
// ==========================
// *** ATENÇÃO: Substitua os valores abaixo com as chaves do seu projeto Firebase. ***
const firebaseConfig = {
  apiKey: "AIzaSyA8Yw9wnKcgSK-svf37hnfzXZyDhtbj3Ro",
  authDomain: "controle-financeiro-emei.firebaseapp.com",
  projectId: "controle-financeiro-emei",
  storageBucket: "controle-financeiro-emei.firebasestorage.app",
  messagingSenderId: "520133382523",
  appId: "1:520133382523:web:952d313fd881bad49cedde"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================
// Elementos e Utilidades
// ==========================
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const hojeISO = () => new Date().toISOString().slice(0, 10);
const yyyymm = (isoDate) => (isoDate || '').slice(0, 7);

const formularioTransacao = document.getElementById('formulario-transacao');
const inputData = document.getElementById('data');
const corpoTabela = document.getElementById('corpo-tabela');
const filtroMes = document.getElementById('filtro-mes');
const indicadorEntradas = document.getElementById('indicador-entradas');
const indicadorSaidas = document.getElementById('indicador-saidas');
const indicadorSaldo = document.getElementById('indicador-saldo');
const graficoFinanceiroCtx = document.getElementById('grafico-financeiro').getContext('2d');
const corpoTabelaAnual = document.getElementById('tabela-anual').querySelector('tbody');
const totalEntradasAnual = document.getElementById('total-entradas-anual');
const totalSaidasAnual = document.getElementById('total-saidas-anual');
const saldoAnual = document.getElementById('saldo-anual');
const formularioFornecedor = document.getElementById('formulario-fornecedor');
const listaFornecedores = document.getElementById('lista-fornecedores');
const inputNovoFornecedor = document.getElementById('novo-fornecedor');
const btnImprimirMensal = document.getElementById('btn-imprimir-mensal');
const btnImprimirAnual = document.getElementById('btn-imprimir-anual');
const camadaModal = document.getElementById('camada-modal');
const tituloModal = document.getElementById('titulo-modal');
const mensagemModal = document.getElementById('mensagem-modal');
const btnModalConfirmar = document.getElementById('btn-modal-confirmar');
const btnModalCancelar = document.getElementById('btn-modal-cancelar');
const carregandoSpinner = document.getElementById('carregando-spinner');

let transacoes = [];
let fornecedores = [];
let graficoMensal;
let graficoAnual;

// ==========================
// Funções de UI
// ==========================
function mostrarCarregando() {
    carregandoSpinner.classList.add('active');
}

function esconderCarregando() {
    carregandoSpinner.classList.remove('active');
}

function mostrarModal(mensagem, isConfirm = false, onConfirm = null) {
    if (isConfirm) {
        if (confirm(mensagem)) {
            if (onConfirm) onConfirm();
        }
    } else {
        alert(mensagem);
    }
}

function esconderModal() {
    camadaModal.classList.remove('active');
}

// ==========================
// Funções Firestore
// ==========================
const getTransacoesCollection = () => collection(db, 'transacoes');
const getFornecedoresCollection = () => collection(db, 'fornecedores');

async function salvarTransacao(transacao) {
    try {
        await addDoc(getTransacoesCollection(), transacao);
        mostrarModal("Lançamento salvo com sucesso!");
    } catch (e) {
        mostrarModal("Erro ao salvar lançamento: " + e.message, false);
    }
}

async function excluirTransacao(id) {
    mostrarModal("Tem certeza que deseja excluir esta transação?", true, async () => {
        try {
            await deleteDoc(doc(getTransacoesCollection(), id));
            mostrarModal("Lançamento excluído com sucesso!");
        } catch (e) {
            mostrarModal("Erro ao excluir lançamento: " + e.message, false);
        }
    });
}

async function salvarFornecedor(nome) {
    try {
        await addDoc(getFornecedoresCollection(), { nome });
        inputNovoFornecedor.value = '';
    } catch (e) {
        mostrarModal("Erro ao salvar fornecedor: " + e.message, false);
    }
}

async function excluirFornecedor(id) {
    mostrarModal("Tem certeza que deseja excluir este fornecedor?", true, async () => {
        try {
            await deleteDoc(doc(getFornecedoresCollection(), id));
            mostrarModal("Fornecedor excluído com sucesso!");
        } catch (e) {
            mostrarModal("Erro ao excluir fornecedor: " + e.message, false);
        }
    });
}

// ==========================
// Funções de Impressão
// ==========================
function lidarComImpressao(secaoId) {
    mostrarModal("Deseja imprimir este relatório?", true, () => {
        const secoesParaOcultar = document.querySelectorAll('main > section:not(#' + secaoId + ')');
        const displayOriginal = [];
        
        secoesParaOcultar.forEach(secao => {
            displayOriginal.push(secao.style.display);
            secao.style.display = 'none';
        });

        const botoesImprimir = document.querySelector(`#${secaoId} .container-botoes-imprimir`);
        if (botoesImprimir) {
            botoesImprimir.style.display = 'none';
        }
        
        setTimeout(() => {
            window.print();
        }, 100);

        esconderModal();

        window.addEventListener('afterprint', () => {
            secoesParaOcultar.forEach((secao, indice) => {
                secao.style.display = displayOriginal[indice];
            });
            if (botoesImprimir) {
                botoesImprimir.style.display = '';
            }
        });
    });
}

// ==========================
// Funções de Renderização
// ==========================
function atualizarInterface() {
    const mesAlvo = filtroMes.value;
    const lista = transacoes.filter(t => yyyymm(t.data) === mesAlvo);

    corpoTabela.innerHTML = '';
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
            <td><button class="excluir" data-id="${t.id}" onclick="excluirTransacao('${t.id}')">Excluir</button></td>
        `;
        corpoTabela.appendChild(tr);
        if (t.tipo === 'entrada') totalEntradas += t.valor;
        else totalSaidas += t.valor;
    });

    const saldo = totalEntradas - totalSaidas;
    indicadorEntradas.textContent = BRL.format(totalEntradas);
    indicadorSaidas.textContent = BRL.format(totalSaidas);
    indicadorSaldo.textContent = BRL.format(saldo);

    atualizarGraficoMensal(lista);
    renderizarTabelaAnual();
    renderizarFornecedores();
}

function atualizarGraficoMensal(lista) {
    if (graficoMensal) graficoMensal.destroy();
    const entradas = lista.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0);
    const saidas = lista.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0);

    graficoMensal = new Chart(graficoFinanceiroCtx, {
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

    corpoTabelaAnual.innerHTML = '';
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
        corpoTabelaAnual.appendChild(tr);
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

    graficoAnual = new Chart(document.getElementById('grafico-anual').getContext('2d'), {
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
    const seletorFornecedor = document.getElementById('fornecedor');
    if (seletorFornecedor) {
        seletorFornecedor.innerHTML = '<option value="">-- Selecione --</option>';
        fornecedores.forEach(f => {
            const option = document.createElement('option');
            option.value = f.nome;
            option.textContent = f.nome;
            seletorFornecedor.appendChild(option);
        });
    }

    listaFornecedores.innerHTML = '';
    fornecedores.forEach(f => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${f.nome}</span><button class="remover" data-id="${f.id}" onclick="excluirFornecedor('${f.id}')">Remover</button>`;
        listaFornecedores.appendChild(li);
    });
}

// ==========================
// Listeners e Inicialização
// ==========================
function iniciarApp() {
    mostrarCarregando();
    inputData.value = hojeISO();
    filtroMes.value = yyyymm(hojeISO());

    window.excluirTransacao = excluirTransacao;
    window.excluirFornecedor = excluirFornecedor;
    
    onSnapshot(query(getTransacoesCollection()), (querySnapshot) => {
        transacoes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        atualizarInterface();
        esconderCarregando();
    });

    onSnapshot(query(getFornecedoresCollection()), (querySnapshot) => {
        fornecedores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarFornecedores();
        esconderCarregando();
    });

    formularioTransacao.addEventListener('submit', (e) => {
        e.preventDefault();
        const transacao = {
            descricao: document.getElementById('descricao').value,
            valor: parseFloat(document.getElementById('valor').value),
            tipo: document.getElementById('tipo').value,
            data: document.getElementById('data').value,
            fornecedor: document.getElementById('fornecedor').value || null
        };
        salvarTransacao(transacao);
        formularioTransacao.reset();
    });

    formularioFornecedor.addEventListener('submit', (e) => {
        e.preventDefault();
        salvarFornecedor(inputNovoFornecedor.value);
    });

    filtroMes.addEventListener('change', atualizarInterface);

    btnImprimirMensal.addEventListener('click', () => lidarComImpressao('secao-relatorio'));
    btnImprimirAnual.addEventListener('click', () => lidarComImpressao('secao-relatorio-anual'));

    camadaModal.addEventListener('click', (e) => {
      if (e.target === camadaModal) {
        esconderModal();
      }
    });
}

document.addEventListener('DOMContentLoaded', iniciarApp);
