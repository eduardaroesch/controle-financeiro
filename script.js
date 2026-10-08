import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  query
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Configuração e Inicialização do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD3Dt4KqqZaK6h7WpzoYtUw8CQfsSKUMlk",
  authDomain: "controle-financeiro-emei.firebaseapp.com",
  projectId: "controle-financeiro-emei",
  storageBucket: "controle-financeiro-emei.firebasestorage.app",
  messagingSenderId: "520133382523",
  appId: "1:520133382523:web:952d313fd881bad49cedde"
};
// Inicializa o Firebase usando as configurações do projeto
const app = initializeApp(firebaseConfig);
// Cria a conexão com o Firestore, que será usada para salvar e consultar os dados
const db = getFirestore(app);

// Referências DOM
const formularioTransacao = document.getElementById("formulario-transacao");
const inputDescricao = document.getElementById("descricao");
const inputValor = document.getElementById("valor");
const inputData = document.getElementById("data");
const selectTipo = document.getElementById("tipo");
const selectFornecedor = document.getElementById("fornecedor");
const botoesTipo = document.querySelectorAll(".segment-btn");
const corpoTabela = document.getElementById("corpo-tabela");
const filtroMes = document.getElementById("filtro-mes");
const btnMesAtual = document.getElementById("btn-mes-atual");
const indicadorEntradas = document.getElementById("indicador-entradas");
const indicadorSaidas = document.getElementById("indicador-saidas");
const indicadorSaldo = document.getElementById("indicador-saldo");
const saldoStrip = document.getElementById("saldo-strip");
const contadorMovimentacoes = document.getElementById("contador-movimentacoes");
const periodoGraficoMensal = document.getElementById("periodo-grafico-mensal");
const graficoFinanceiroCanvas = document.getElementById("grafico-financeiro");
const corpoTabelaAnual = document.getElementById("corpo-tabela-anual");
const totalEntradasAnual = document.getElementById("total-entradas-anual");
const totalSaidasAnual = document.getElementById("total-saidas-anual");
const saldoAnual = document.getElementById("saldo-anual");
const totalEntradasAnualRodape = document.getElementById("total-entradas-anual-rodape");
const totalSaidasAnualRodape = document.getElementById("total-saidas-anual-rodape");
const saldoAnualRodape = document.getElementById("saldo-anual-rodape");
const filtroAno = document.getElementById("filtro-ano");
const periodoGraficoAnual = document.getElementById("periodo-grafico-anual");
const graficoAnualCanvas = document.getElementById("grafico-anual");
const formularioFornecedor = document.getElementById("formulario-fornecedor");
const inputNovoFornecedor = document.getElementById("novo-fornecedor");
const listaFornecedores = document.getElementById("lista-fornecedores");
const btnImprimirMensal = document.getElementById("btn-imprimir-mensal");
const btnImprimirAnual = document.getElementById("btn-imprimir-anual");
const btnSalvarTransacao = document.getElementById("btn-salvar-transacao");
const toastContainer = document.getElementById("toast-container");

const dialogConfirmacao = document.getElementById("dialog-confirmacao");
const dialogConfirmacaoMensagem = document.getElementById("dialog-confirmacao-mensagem");
const btnDialogConfirmar = dialogConfirmacao.querySelector("[data-dialog-confirmar]");
const btnDialogCancelar = dialogConfirmacao.querySelector("[data-dialog-cancelar]");

const dialogEdicao = document.getElementById("dialog-edicao");
const formularioEdicao = document.getElementById("form-edicao");
const inputEditarId = document.getElementById("editar-id");
const inputEditarDescricao = document.getElementById("editar-descricao");
const inputEditarValor = document.getElementById("editar-valor");
const inputEditarData = document.getElementById("editar-data");
const selectEditarTipo = document.getElementById("editar-tipo");
const selectEditarFornecedor = document.getElementById("editar-fornecedor");

// Variáveis de Estado do Projeto
let transacoes = [];
let fornecedores = [];
let graficoMensal = null;
let graficoAnual = null;
let confirmacaoPendente = null;

// Utilitários

// Define a formatação dos valores monetários no padrão brasileiro
const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const MESES_LONGOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MESES_CURTOS = [
  "jan.", "fev.", "mar.", "abr.", "mai.", "jun.",
  "jul.", "ago.", "set.", "out.", "nov.", "dez."
];
// Retorna a data atual no formato YYYY-MM-DD, considerando o horário local
function hojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function yyyymm(isoDate) {
  return String(isoDate || "").slice(0, 7);
}

function anoAtual() {
  return String(new Date().getFullYear());
}

function numeroSeguro(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function formatarMes(yyyyMm, formato = "longo") {
  const [ano, mes] = String(yyyyMm || "").split("-");
  const indice = Number(mes) - 1;
  if (!ano || indice < 0 || indice > 11) return "Período selecionado";
  return formato === "curto" ? `${MESES_CURTOS[indice]} ${ano}` : `${MESES_LONGOS[indice]} de ${ano}`;
}

function formatarData(isoDate) {
  if (!isoDate) return "—";
  const [ano, mes, dia] = String(isoDate).split("-").map(Number);
  if (![ano, mes, dia].every(Number.isFinite)) return isoDate;
  return new Intl.DateTimeFormat("pt-BR").format(new Date(ano, mes - 1, dia));
}

function mostrarToast(mensagem, tipo = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.setAttribute("role", tipo === "error" ? "alert" : "status");
  toast.textContent = mensagem;
  toastContainer.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3800);
}

function setTipoSelecionado(tipo) {
  selectTipo.value = tipo;
  botoesTipo.forEach((botao) => {
    const selecionado = botao.dataset.tipo === tipo;
    botao.classList.toggle("selected", selecionado);
    botao.setAttribute("aria-pressed", String(selecionado));
  });
}

function getTransacoesCollection() {
  return collection(db, "transacoes");
}

function getFornecedoresCollection() {
  return collection(db, "fornecedores");
}

function atualizarOpcoesFornecedores() {
  const selects = [selectFornecedor, selectEditarFornecedor];

  selects.forEach((select) => {
    const valorAtual = select.value;
    select.replaceChildren();

    const opcaoVazia = document.createElement("option");
    opcaoVazia.value = "";
    opcaoVazia.textContent = "Sem fornecedor informado";
    select.appendChild(opcaoVazia);

    const ordenados = [...fornecedores].sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
    ordenados.forEach((fornecedor) => {
      const option = document.createElement("option");
      option.value = fornecedor.nome;
      option.textContent = fornecedor.nome;
      select.appendChild(option);
    });

    if ([...select.options].some((option) => option.value === valorAtual)) {
      select.value = valorAtual;
    }
  });
}

// ===================================
// Firestore
// ===================================
async function salvarTransacao(transacao) {
  try {
    await addDoc(getTransacoesCollection(), transacao);
    mostrarToast("Lançamento salvo com sucesso.");
    return true;
  } catch (erro) {
    console.error("Erro ao salvar lançamento:", erro);
    mostrarToast("Não foi possível salvar o lançamento.", "error");
    return false;
  }
}

async function atualizarTransacao(id, transacao) {
  try {
    await updateDoc(doc(getTransacoesCollection(), id), transacao);
    mostrarToast("Lançamento atualizado com sucesso.");
    return true;
  } catch (erro) {
    console.error("Erro ao atualizar lançamento:", erro);
    mostrarToast("Não foi possível atualizar o lançamento.", "error");
    return false;
  }
}

async function excluirTransacao(id) {
  try {
    await deleteDoc(doc(getTransacoesCollection(), id));
    mostrarToast("Lançamento excluído com sucesso.");
  } catch (erro) {
    console.error("Erro ao excluir lançamento:", erro);
    mostrarToast("Não foi possível excluir o lançamento.", "error");
  }
}

async function salvarFornecedor(nome) {
  const nomeLimpo = String(nome || "").trim();
  if (!nomeLimpo) return false;

  const duplicado = fornecedores.some((fornecedor) => String(fornecedor.nome ?? "").trim().toLocaleLowerCase("pt-BR") === nomeLimpo.toLocaleLowerCase("pt-BR"));
  if (duplicado) {
    mostrarToast("Esse fornecedor já está cadastrado.", "error");
    return false;
  }

  try {
    await addDoc(getFornecedoresCollection(), { nome: nomeLimpo });
    mostrarToast("Fornecedor adicionado com sucesso.");
    inputNovoFornecedor.value = "";
    return true;
  } catch (erro) {
    console.error("Erro ao salvar fornecedor:", erro);
    mostrarToast("Não foi possível salvar o fornecedor.", "error");
    return false;
  }
}

async function excluirFornecedor(id) {
  try {
    await deleteDoc(doc(getFornecedoresCollection(), id));
    mostrarToast("Fornecedor removido com sucesso.");
  } catch (erro) {
    console.error("Erro ao excluir fornecedor:", erro);
    mostrarToast("Não foi possível remover o fornecedor.", "error");
  }
}

// ===================================
// Modal de confirmação
// ===================================
function pedirConfirmacao(mensagem, callback) {
  dialogConfirmacaoMensagem.textContent = mensagem;
  confirmacaoPendente = callback;
  dialogConfirmacao.showModal();
}

function fecharConfirmacao() {
  confirmacaoPendente = null;
  dialogConfirmacao.close();
}

btnDialogCancelar.addEventListener("click", fecharConfirmacao);

btnDialogConfirmar.addEventListener("click", async () => {
  const callback = confirmacaoPendente;
  confirmacaoPendente = null;
  dialogConfirmacao.close();
  if (callback) await callback();
});

dialogConfirmacao.addEventListener("click", (evento) => {
  if (evento.target === dialogConfirmacao) fecharConfirmacao();
});

// ===================================
// Edição
// ===================================
function abrirEdicao(id) {
  const transacao = transacoes.find((item) => item.id === id);
  if (!transacao) return;

  inputEditarId.value = transacao.id;
  inputEditarDescricao.value = transacao.descricao || "";
  inputEditarValor.value = numeroSeguro(transacao.valor).toFixed(2);
  inputEditarData.value = transacao.data || hojeISO();
  selectEditarTipo.value = transacao.tipo === "saida" ? "saida" : "entrada";
  atualizarOpcoesFornecedores();
  selectEditarFornecedor.value = transacao.fornecedor || "";
  dialogEdicao.showModal();
}

function fecharEdicao() {
  dialogEdicao.close();
}

formularioEdicao.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const id = inputEditarId.value;
  const descricao = inputEditarDescricao.value.trim();
  const valor = numeroSeguro(inputEditarValor.value);
  const data = inputEditarData.value;
  const tipo = selectEditarTipo.value;
  const fornecedor = selectEditarFornecedor.value || null;

  if (!id || !descricao || valor <= 0 || !data || !tipo) {
    mostrarToast("Preencha os campos obrigatórios.", "error");
    return;
  }

  const botao = formularioEdicao.querySelector('button[type="submit"]');
  botao.disabled = true;
  const sucesso = await atualizarTransacao(id, { descricao, valor, data, tipo, fornecedor });
  botao.disabled = false;

  if (sucesso) fecharEdicao();
});

document.querySelectorAll("[data-dialog-edicao-fechar]").forEach((botao) => {
  botao.addEventListener("click", fecharEdicao);
});

dialogEdicao.addEventListener("click", (evento) => {
  if (evento.target === dialogEdicao) fecharEdicao();
});

// ===================================
// Renderização de transações
// ===================================
function criarCelula(texto, classe = "") {
  const td = document.createElement("td");
  td.className = classe;
  td.textContent = texto;
  return td;
}

function renderizarTabelaMensal(lista) {
  corpoTabela.replaceChildren();

  if (lista.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "Nenhum lançamento registrado neste mês.";
    tr.appendChild(td);
    corpoTabela.appendChild(tr);
    return;
  }

  const listaOrdenada = [...lista].sort((a, b) => {
    const porData = String(b.data || "").localeCompare(String(a.data || ""));
    if (porData !== 0) return porData;
    return String(a.descricao || "").localeCompare(String(b.descricao || ""), "pt-BR");
  });

  listaOrdenada.forEach((transacao) => {
    const tr = document.createElement("tr");
    const valor = numeroSeguro(transacao.valor);
    const tipo = transacao.tipo === "saida" ? "saida" : "entrada";

    tr.appendChild(criarCelula(formatarData(transacao.data)));
    tr.appendChild(criarCelula(transacao.descricao || "Sem descrição"));
    tr.appendChild(criarCelula(transacao.fornecedor || "—"));

    const tipoCell = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = `type-pill ${tipo}`;
    pill.textContent = tipo === "entrada" ? "● Entrada" : "● Saída";
    tipoCell.appendChild(pill);
    tr.appendChild(tipoCell);

    tr.appendChild(criarCelula(BRL.format(valor), `numeric ${tipo === "entrada" ? "value-positive" : "value-negative"}`));

    const actions = document.createElement("td");
    actions.className = "actions-cell";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "action-btn";
    editar.dataset.action = "editar-transacao";
    editar.dataset.id = transacao.id;
    editar.title = "Editar lançamento";
    editar.setAttribute("aria-label", `Editar lançamento: ${String(transacao.descricao || "sem descrição")}`);
    editar.textContent = "✎";

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "action-btn danger";
    excluir.dataset.action = "excluir-transacao";
    excluir.dataset.id = transacao.id;
    excluir.title = "Excluir lançamento";
    excluir.setAttribute("aria-label", `Excluir lançamento: ${String(transacao.descricao || "sem descrição")}`);
    excluir.textContent = "⌫";

    actions.append(editar, excluir);
    tr.appendChild(actions);
    corpoTabela.appendChild(tr);
  });
}

// ===================================
// KPIs e gráfico mensal
// ===================================
function calcularTotais(lista) {
  return lista.reduce((totais, transacao) => {
    const valor = numeroSeguro(transacao.valor);
    if (transacao.tipo === "entrada") totais.entradas += valor;
    else if (transacao.tipo === "saida") totais.saidas += valor;
    return totais;
  }, { entradas: 0, saidas: 0 });
}

function atualizarGraficoMensal(lista) {
  if (graficoMensal) graficoMensal.destroy();

  const { entradas, saidas } = calcularTotais(lista);

  graficoMensal = new Chart(graficoFinanceiroCanvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["Entradas", "Saídas"],
      datasets: [{
        data: [entradas, saidas],
        backgroundColor: ["#d9f0e2", "#f8dedd"],
        borderColor: ["#2f8f5b", "#c75b5b"],
        borderWidth: 1.5,
        borderRadius: 10,
        maxBarThickness: 72
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => BRL.format(context.raw)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#707281", font: { weight: "700" } }
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: "#ececf1" },
          ticks: {
            color: "#90919d",
            callback: (valor) => BRL.format(valor).replace("R$", "R$")
          }
        }
      }
    }
  });
}

function atualizarKPIs(lista) {
  const { entradas, saidas } = calcularTotais(lista);
  const saldo = entradas - saidas;
  const periodo = filtroMes.value;

  indicadorEntradas.textContent = BRL.format(entradas);
  indicadorSaidas.textContent = BRL.format(saidas);
  indicadorSaldo.textContent = BRL.format(saldo);
  saldoStrip.textContent = BRL.format(saldo);
  contadorMovimentacoes.textContent = `${lista.length} ${lista.length === 1 ? "lançamento" : "lançamentos"}`;
  periodoGraficoMensal.textContent = formatarMes(periodo, "longo");

  const captionSaldo = document.getElementById("caption-saldo");
  captionSaldo.textContent = saldo >= 0 ? "Saldo positivo" : "Saldo negativo";
}

// ===================================
// Relatório anual
// ===================================
function obterAnosDisponiveis() {
  const anos = new Set([anoAtual()]);
  transacoes.forEach((transacao) => {
    const ano = String(transacao.data || "").slice(0, 4);
    if (/^\d{4}$/.test(ano)) anos.add(ano);
  });
  return [...anos].sort((a, b) => Number(b) - Number(a));
}

function atualizarSeletorAno() {
  const anoAtualSelecionado = filtroAno.value || anoAtual();
  const anos = obterAnosDisponiveis();

  filtroAno.replaceChildren();
  anos.forEach((ano) => {
    const option = document.createElement("option");
    option.value = ano;
    option.textContent = ano;
    filtroAno.appendChild(option);
  });

  filtroAno.value = anos.includes(anoAtualSelecionado) ? anoAtualSelecionado : anos[0];
}

function calcularDadosAnuais(ano) {
  const dados = {};

  for (let indice = 0; indice < 12; indice += 1) {
    const mes = String(indice + 1).padStart(2, "0");
    dados[`${ano}-${mes}`] = { entradas: 0, saidas: 0 };
  }

  transacoes.forEach((transacao) => {
    const data = String(transacao.data || "");
    if (!data.startsWith(`${ano}-`)) return;

    const mesAno = yyyymm(data);
    if (!dados[mesAno]) return;

    const valor = numeroSeguro(transacao.valor);
    if (transacao.tipo === "entrada") dados[mesAno].entradas += valor;
    else if (transacao.tipo === "saida") dados[mesAno].saidas += valor;
  });

  return dados;
}

function renderizarTabelaAnual() {
  const ano = filtroAno.value || anoAtual();
  const dadosAnuais = calcularDadosAnuais(ano);
  let totalEntradas = 0;
  let totalSaidas = 0;

  corpoTabelaAnual.replaceChildren();

  Object.keys(dadosAnuais).forEach((mesAno) => {
    const dados = dadosAnuais[mesAno];
    const saldo = dados.entradas - dados.saidas;
    totalEntradas += dados.entradas;
    totalSaidas += dados.saidas;

    const tr = document.createElement("tr");
    tr.appendChild(criarCelula(formatarMes(mesAno, "curto")));
    tr.appendChild(criarCelula(BRL.format(dados.entradas), "numeric value-positive"));
    tr.appendChild(criarCelula(BRL.format(dados.saidas), "numeric value-negative"));
    tr.appendChild(criarCelula(BRL.format(saldo), "numeric"));
    corpoTabelaAnual.appendChild(tr);
  });

  const saldo = totalEntradas - totalSaidas;
  totalEntradasAnual.textContent = BRL.format(totalEntradas);
  totalSaidasAnual.textContent = BRL.format(totalSaidas);
  saldoAnual.textContent = BRL.format(saldo);
  totalEntradasAnualRodape.textContent = BRL.format(totalEntradas);
  totalSaidasAnualRodape.textContent = BRL.format(totalSaidas);
  saldoAnualRodape.textContent = BRL.format(saldo);
  periodoGraficoAnual.textContent = `Ano ${ano}`;

  atualizarGraficoAnual(dadosAnuais, ano);
}

function atualizarGraficoAnual(dadosAnuais, ano) {
  if (graficoAnual) graficoAnual.destroy();

  const meses = Object.keys(dadosAnuais);
  const entradas = meses.map((mes) => dadosAnuais[mes].entradas);
  const saidas = meses.map((mes) => dadosAnuais[mes].saidas);
  const labels = meses.map((mes) => formatarMes(mes, "curto").split(" ")[0]);

  graficoAnual = new Chart(graficoAnualCanvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Entradas",
          data: entradas,
          borderColor: "#2f8f5b",
          backgroundColor: "rgba(47,143,91,0.08)",
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false
        },
        {
          label: "Saídas",
          data: saidas,
          borderColor: "#c75b5b",
          backgroundColor: "rgba(199,91,91,0.08)",
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 7,
            color: "#5f606b",
            font: { weight: "700" }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${BRL.format(context.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#7e7f8a", font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: "#ececf1" },
          ticks: { color: "#90919d" }
        }
      }
    }
  });
}

// ===================================
// Fornecedores
// ===================================
function renderizarFornecedores() {
  atualizarOpcoesFornecedores();
  listaFornecedores.replaceChildren();

  if (fornecedores.length === 0) {
    const vazio = document.createElement("li");
    vazio.className = "empty-list";
    vazio.textContent = "Nenhum fornecedor cadastrado ainda.";
    listaFornecedores.appendChild(vazio);
    return;
  }

  [...fornecedores]
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"))
    .forEach((fornecedor) => {
      const li = document.createElement("li");
      li.className = "fornecedor-item";

      const nome = document.createElement("span");
      nome.textContent = fornecedor.nome;

      const remover = document.createElement("button");
      remover.type = "button";
      remover.className = "remove-supplier";
      remover.dataset.action = "excluir-fornecedor";
      remover.dataset.id = fornecedor.id;
      remover.textContent = "Remover";

      li.append(nome, remover);
      listaFornecedores.appendChild(li);
    });
}

// ===================================
// Interface
// ===================================
function atualizarInterface() {
  const mesAlvo = filtroMes.value;
  const lista = transacoes.filter((transacao) => yyyymm(transacao.data) === mesAlvo);

  renderizarTabelaMensal(lista);
  atualizarKPIs(lista);
  atualizarGraficoMensal(lista);
  atualizarSeletorAno();
  const [anoDoMes] = mesAlvo.split("-");
  if (anoDoMes && [...filtroAno.options].some((option) => option.value === anoDoMes)) {
    filtroAno.value = anoDoMes;
  }
  renderizarTabelaAnual();
  renderizarFornecedores();
}

// ===================================
// Impressão
// ===================================
function imprimirRelatorio(classe) {
  document.body.classList.remove("imprimindo-mensal", "imprimindo-anual");
  document.body.classList.add(classe);
  window.setTimeout(() => window.print(), 50);
}

window.addEventListener("afterprint", () => {
  document.body.classList.remove("imprimindo-mensal", "imprimindo-anual");
});

// ===================================
// Eventos
// ===================================
botoesTipo.forEach((botao) => {
  botao.addEventListener("click", () => setTipoSelecionado(botao.dataset.tipo));
});

formularioTransacao.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  // Usa os elementos do próprio formulário para evitar dependência de referências externas.
  const formulario = evento.currentTarget;
  const campoDescricao = formulario.querySelector("#descricao");
  const campoValor = formulario.querySelector("#valor");
  const campoData = formulario.querySelector("#data");
  const campoTipo = formulario.querySelector("#tipo");
  const campoFornecedor = formulario.querySelector("#fornecedor");

  const descricao = campoDescricao.value.trim();
  const valor = numeroSeguro(campoValor.value);
  const data = campoData.value;
  const tipo = campoTipo.value;
  const fornecedor = campoFornecedor.value || null;

  if (!descricao || valor <= 0 || !data || !tipo) {
    mostrarToast("Preencha todos os campos obrigatórios.", "error");
    return;
  }

  btnSalvarTransacao.disabled = true;
  btnSalvarTransacao.textContent = "Salvando...";

  const sucesso = await salvarTransacao({ descricao, valor, tipo, data, fornecedor });

  btnSalvarTransacao.disabled = false;
  btnSalvarTransacao.textContent = "＋ Adicionar lançamento";

  if (!sucesso) return;

  formulario.reset();
  campoData.value = data;
  setTipoSelecionado("entrada");
});

formularioFornecedor.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  await salvarFornecedor(inputNovoFornecedor.value);
});

filtroMes.addEventListener("change", () => {
  const [anoDoMes] = filtroMes.value.split("-");
  if (anoDoMes && [...filtroAno.options].some((option) => option.value === anoDoMes)) {
    filtroAno.value = anoDoMes;
  }
  atualizarInterface();
});

btnMesAtual.addEventListener("click", () => {
  filtroMes.value = yyyymm(hojeISO());
  filtroAno.value = anoAtual();
  atualizarInterface();
});

filtroAno.addEventListener("change", () => {
  renderizarTabelaAnual();
});

btnImprimirMensal.addEventListener("click", () => {
  imprimirRelatorio("imprimindo-mensal");
});

btnImprimirAnual.addEventListener("click", () => {
  imprimirRelatorio("imprimindo-anual");
});

// Delegação de eventos para ações da tabela e fornecedores.
document.addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-action]");
  if (!botao) return;

  const { action, id } = botao.dataset;
  if (!id) return;

  if (action === "editar-transacao") {
    abrirEdicao(id);
    return;
  }

  if (action === "excluir-transacao") {
    const transacao = transacoes.find((item) => item.id === id);
    const descricao = transacao?.descricao || "este lançamento";
    pedirConfirmacao(`Tem certeza que deseja excluir “${descricao}”? Essa ação não pode ser desfeita.`, async () => {
      await excluirTransacao(id);
    });
    return;
  }

  if (action === "excluir-fornecedor") {
    const fornecedor = fornecedores.find((item) => item.id === id);
    const nome = fornecedor?.nome || "este fornecedor";
    pedirConfirmacao(`Tem certeza que deseja remover “${nome}” da lista de fornecedores?`, async () => {
      await excluirFornecedor(id);
    });
  }
});

// ===================================
// Firestore listeners
// ===================================
function iniciarListeners() {
  onSnapshot(
    query(getTransacoesCollection()),
    (snapshot) => {
      transacoes = snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
      atualizarInterface();
    },
    (erro) => {
      console.error("Erro ao carregar transações:", erro);
      mostrarToast("Não foi possível carregar os lançamentos. Verifique as permissões do Firestore.", "error");
    }
  );

  onSnapshot(
    query(getFornecedoresCollection()),
    (snapshot) => {
      fornecedores = snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
      renderizarFornecedores();
    },
    (erro) => {
      console.error("Erro ao carregar fornecedores:", erro);
      mostrarToast("Não foi possível carregar os fornecedores. Verifique as permissões do Firestore.", "error");
    }
  );
}

function iniciarApp() {
  const hoje = hojeISO();
  inputData.value = hoje;
  filtroMes.value = yyyymm(hoje);
  filtroAno.value = anoAtual();
  setTipoSelecionado("entrada");
  atualizarSeletorAno();
  iniciarListeners();
}

iniciarApp();