import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, addDoc, deleteDoc, query } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ===================================
// Configuração e Inicialização do Firebase
// ===================================

const firebaseConfig = {
  apiKey: "AIzaSyBMoHgXI5OFi1u0NdA1CuAL8lujsPwPGVA",,
  authDomain: "controle-financeiro-emei.firebaseapp.com",
  projectId: "controle-financeiro-emei",
  storageBucket: "controle-financeiro-emei.firebasestorage.app",
  messagingSenderId: "520133382523",
  appId: "1:520133382523:web:952d313fd881bad49cedde"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===================================
// Referências a Elementos HTML
// ===================================
// Esta seção centraliza a seleção de todos os elementos HTML usados no script,
// facilitando a identificação e manutenção.
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

// ===================================
// Variáveis de Estado da Aplicação
// ===================================
let transacoes = [];
let fornecedores = [];
let graficoMensal;
let graficoAnual;

// ===================================
// Funções Utilitárias e de UI
// ===================================
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const hojeISO = () => new Date().toISOString().slice(0, 10);
const yyyymm = (isoDate) => (isoDate || '').slice(0, 7);

function mostrarAlertaOuConfirmar(mensagem, ehConfirmacao = false, callbackConfirmacao = null) {
    if (ehConfirmacao) {
        if (confirm(mensagem)) {
            if (callbackConfirmacao) callbackConfirmacao();
        }
    } else {
        alert(mensagem);
    }
}

// ===================================
// Funções de Interação com o Firestore
// ===================================
// Funções para obter as referências às coleções de dados
const getTransacoesCollection = () => collection(db, 'transacoes');
const getFornecedoresCollection = () => collection(db, 'fornecedores');

/**
 * Salva uma nova transação no Firestore.
 * @param {object} transacao - Objeto contendo os dados da transação.
 */
async function salvarTransacao(transacao) {
    try {
        await addDoc(getTransacoesCollection(), transacao);
        mostrarAlertaOuConfirmar("Lançamento salvo com sucesso!");
    } catch (e) {
        mostrarAlertaOuConfirmar("Erro ao salvar lançamento: " + e.message);
    }
}

/**
 * Exclui uma transação específica do Firestore.
 * Pede confirmação antes de executar a exclusão.
 * @param {string} id - O ID do documento da transação a ser excluída.
 */
async function excluirTransacao(id) {
    mostrarAlertaOuConfirmar("Tem certeza que deseja excluir esta transação?", true, async () => {
        try {
            await deleteDoc(doc(getTransacoesCollection(), id));
            mostrarAlertaOuConfirmar("Lançamento excluído com sucesso!");
        } catch (e) {
            mostrarAlertaOuConfirmar("Erro ao excluir lançamento: " + e.message);
        }
    });
}

/**
 * Salva um novo fornecedor no Firestore.
 * @param {string} nome - O nome do fornecedor.
 */
async function salvarFornecedor(nome) {
    try {
        await addDoc(getFornecedoresCollection(), { nome });
        inputNovoFornecedor.value = '';
    } catch (e) {
        mostrarAlertaOuConfirmar("Erro ao salvar fornecedor: " + e.message);
    }
}

/**
 * Exclui um fornecedor específico do Firestore.
 * Pede confirmação antes de executar a exclusão.
 * @param {string} id - O ID do documento do fornecedor a ser excluído.
 */
async function excluirFornecedor(id) {
    mostrarAlertaOuConfirmar("Tem certeza que deseja excluir este fornecedor?", true, async () => {
        try {
            await deleteDoc(doc(getFornecedoresCollection(), id));
            mostrarAlertaOuConfirmar("Fornecedor excluído com sucesso!");
        } catch (e) {
            mostrarAlertaOuConfirmar("Erro ao excluir fornecedor: " + e.message);
        }
    });
}

// ===================================
// Funções de Impressão e UI
// ===================================

/**
 * Lida com a funcionalidade de impressão da página, ocultando seções desnecessárias.
 * @param {string} secaoId - O ID da seção que deve ser impressa.
 */
function lidarComImpressao(secaoId) {
    mostrarAlertaOuConfirmar("Deseja imprimir este relatório?", true, () => {
        const secoesParaOcultar = document.querySelectorAll(`main > section:not(#${secaoId})`);
        const displayOriginal = [];
        
        // Esconde as seções que não serão impressas para manter o layout limpo
        secoesParaOcultar.forEach(secao => {
            displayOriginal.push(secao.style.display);
            secao.style.display = 'none';
        });

        // Oculta o botão de imprimir para que ele não apareça no documento impresso
        const botoesImprimir = document.querySelector(`#${secaoId} .container-botoes-imprimir`);
        if (botoesImprimir) {
            botoesImprimir.style.display = 'none';
        }
        
        // Pequeno atraso para garantir que o navegador processe as mudanças de estilo antes de imprimir
        setTimeout(() => {
            window.print();
        }, 100);

        // Restaura o layout após a impressão
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

/**
 * Atualiza toda a interface do usuário com os dados mais recentes.
 */
function atualizarInterface() {
    const mesAlvo = filtroMes.value;
    const lista = transacoes.filter(t => yyyymm(t.data) === mesAlvo);

    // Limpa o corpo da tabela antes de preencher
    corpoTabela.innerHTML = '';
    let totalEntradas = 0, totalSaidas = 0;

    // Ordena as transações por data (do mais antigo para o mais recente)
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

/**
 * Atualiza o gráfico mensal com base nas transações filtradas.
 * @param {Array} lista - Lista de transações do mês selecionado.
 */
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

/**
 * Renderiza a tabela de resumo anual.
 */
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

/**
 * Atualiza o gráfico anual com base nos dados anuais.
 * @param {object} dadosAnuais - Objeto contendo os totais de entradas e saídas por mês.
 */
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

/**
 * Renderiza a lista de fornecedores e atualiza o seletor.
 */
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

// ===================================
// Listeners de Eventos e Inicialização da Aplicação
// ===================================

/**
 * Inicia a aplicação, configurando listeners e buscando dados iniciais.
 */
function iniciarApp() {
    inputData.value = hojeISO();
    filtroMes.value = yyyymm(hojeISO());

    // Expondo funções para o escopo global (usado no HTML para os eventos onclick)
    window.excluirTransacao = excluirTransacao;
    window.excluirFornecedor = excluirFornecedor;
    
    // Configura os listeners em tempo real para as coleções do Firestore
    // Sempre que os dados de 'transacoes' mudam, a interface é atualizada.
    onSnapshot(query(getTransacoesCollection()), (querySnapshot) => {
        transacoes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        atualizarInterface();

    });

    // Sempre que os dados de 'fornecedores' mudam, a lista é atualizada.
    onSnapshot(query(getFornecedoresCollection()), (querySnapshot) => {
        fornecedores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarFornecedores();
    });

    // Configura os outros listeners de eventos (formulários, botões, etc.)
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
}
// Inicia a aplicação quando o DOM estiver completamente carregado.
document.addEventListener('DOMContentLoaded', iniciarApp);
