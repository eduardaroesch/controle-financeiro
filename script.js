import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ==========================
// Firebase Config
// ==========================
const firebaseConfig = {
  apiKey: "AIzaSyA8Yw9wnKcgSK-svf37hnfzXZyDhtbj3Ro",
  authDomain: "controle-financeiro-emei.firebaseapp.com",
  projectId: "controle-financeiro-emei",
  storageBucket: "controle-financeiro-emei.firebasestorage.app",
  messagingSenderId: "520133382523",
  appId: "1:520133382523:web:952d313fd881bad49cedde"
};

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);

// ==========================
// Utilidades
// ==========================
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const hojeISO = () => new Date().toISOString().slice(0,10);
const yyyymm = (isoDate) => (isoDate || '').slice(0,7);

// ==========================
// Elementos do app
// ==========================
const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const app = document.getElementById('app');
const btnLogout = document.getElementById('logout');

const form = document.getElementById('transaction-form');
const tabelaCorpo = document.getElementById('tabela-corpo');
const saldoSpan = document.getElementById('saldo');
const inputData = document.getElementById('data');
const inputDescricao = document.getElementById('descricao');
const inputValor = document.getElementById('valor');
const selectTipo = document.getElementById('tipo');
const selectFornecedor = document.getElementById('fornecedor');
const filtroMes = document.getElementById('filtro-mes');

const kpiEntradas = document.getElementById('kpi-entradas');
const kpiSaidas = document.getElementById('kpi-saidas');
const kpiSaldo = document.getElementById('kpi-saldo');

const fornecedorForm = document.getElementById('fornecedor-form');
const novoFornecedorInput = document.getElementById('novo-fornecedor');
const listaFornecedoresUL = document.getElementById('lista-fornecedores');

const msgErro = document.getElementById('mensagem-erro');

// ==========================
// Estado
// ==========================
let transacoes = [];
let fornecedores = [];

// ==========================
// Funções Firebase
// ==========================
async function carregarDados() {
  transacoes = [];
  fornecedores = [];

  const snapTransacoes = await getDocs(collection(db, "transacoes"));
  snapTransacoes.forEach(docSnap => transacoes.push({ id: docSnap.id, ...docSnap.data() }));

  const snapFornecedores = await getDocs(collection(db, "fornecedores"));
  snapFornecedores.forEach(docSnap => fornecedores.push(docSnap.data().nome));

  renderFornecedores();
  atualizarInterface();
  // atualizarRelatorioAnual(); // opcional
}

async function salvarTransacao(dados) {
  await addDoc(collection(db, "transacoes"), dados);
  await carregarDados();
  mostrarMensagem('Lançamento adicionado com sucesso!');
}

async function excluirTransacao(id) {
  await deleteDoc(doc(db, "transacoes", id));
  await carregarDados();
  mostrarMensagem('Lançamento removido.');
}

async function adicionarFornecedor(nome) {
  const n = (nome || '').trim();
  if (!n) return;
  if (!fornecedores.includes(n)) {
    await addDoc(collection(db, "fornecedores"), { nome: n });
    await carregarDados();
    mostrarMensagem('Fornecedor adicionado.');
  } else {
    alert('Este fornecedor já existe.');
  }
}

async function removerFornecedor(index) {
  const snap = await getDocs(collection(db, "fornecedores"));
  let i = 0;
  snap.forEach(async (docSnap) => {
    if (i === index) await deleteDoc(doc(db, "fornecedores", docSnap.id));
    i++;
  });
  await carregarDados();
  mostrarMensagem('Fornecedor removido.');
}

// ==========================
// Gráfico
// ==========================
const ctx = document.getElementById('graficoFinanceiro').getContext('2d');
let grafico = new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['Entradas', 'Saídas'],
    datasets: [{ data: [0,0], backgroundColor: ['#6a0dad','#e74c3c'], borderWidth: 1 }]
  },
  options: { responsive:true, plugins:{ legend:{ position:'bottom' } } }
});

// ==========================
// Inicialização Inputs
// ==========================
inputData.value = hojeISO();
if (!filtroMes.value) filtroMes.value = hojeISO().slice(0,7);

// ==========================
// Render fornecedores
// ==========================
function renderFornecedores() {
  selectFornecedor.innerHTML = '<option value="" disabled selected>Selecione um fornecedor</option>';
  fornecedores.forEach(nome=>{
    const opt = document.createElement('option');
    opt.value = nome;
    opt.textContent = nome;
    selectFornecedor.appendChild(opt);
  });

  listaFornecedoresUL.innerHTML = '';
  fornecedores.forEach((nome, idx)=>{
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = nome;

    const btn = document.createElement('button');
    btn.textContent = 'Remover';
    btn.className = 'remover';
    btn.onclick = ()=>removerFornecedor(idx);

    li.appendChild(span);
    li.appendChild(btn);
    listaFornecedoresUL.appendChild(li);
  });
}

fornecedorForm.addEventListener('submit', e=>{
  e.preventDefault();
  adicionarFornecedor(novoFornecedorInput.value);
  novoFornecedorInput.value = '';
});

// ==========================
// CRUD Transações
// ==========================
form.addEventListener('submit', e=>{
  e.preventDefault();
  const descricao = inputDescricao.value.trim();
  const valor = parseFloat(inputValor.value);
  const tipo = selectTipo.value;
  const data = inputData.value;
  const fornecedor = selectFornecedor.value;

  if(!descricao||!data||isNaN(valor)){
    msgErro.textContent='Preencha todos os campos corretamente.';
    msgErro.style.display='block';
    return;
  }
  if(valor<=0){
    msgErro.textContent='O valor deve ser maior que zero.';
    msgErro.style.display='block';
    return;
  }

  const hoje = new Date();
  const dataObj = new Date(data+'T00:00:00');
  if(dataObj>hoje){
    msgErro.textContent='A data não pode ser no futuro.';
    msgErro.style.display='block';
    return;
  }

  msgErro.style.display='none';
  salvarTransacao({descricao,valor,tipo,data,fornecedor});
  form.reset();
  inputData.value=hojeISO();
});

// ==========================
// Atualizar Interface
// ==========================
function atualizarInterface(){
  const alvoMes = filtroMes.value;
  const lista = transacoes.filter(t=>yyyymm(t.data)===alvoMes);

  tabelaCorpo.innerHTML='';
  let totalEntradas=0, totalSaidas=0;

  lista.sort((a,b)=>a.data.localeCompare(b.data));
  lista.forEach(t=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${new Date(t.data+'T00:00:00').toLocaleDateString('pt-BR')}</td>
      <td>${t.descricao}</td>
      <td>${t.fornecedor||'-'}</td>
      <td>${BRL.format(t.valor)}</td>
      <td class="${t.tipo}">${t.tipo}</td>
      <td><button class="excluir" onclick="excluirTransacao('${t.id}')">Excluir</button></td>
    `;
    tabelaCorpo.appendChild(tr);
    if(t.tipo==='entrada') totalEntradas+=t.valor;
    else totalSaidas+=t.valor;
  });

  const saldo=totalEntradas-totalSaidas;
  saldoSpan.textContent=BRL.format(saldo);
  kpiEntradas.textContent=BRL.format(totalEntradas);
  kpiSaidas.textContent=BRL.format(totalSaidas);
  kpiSaldo.textContent=BRL.format(saldo);
  grafico.data.datasets[0].data=[totalEntradas,totalSaidas];
  grafico.update();
}

// ==========================
// Mensagem de confirmação
// ==========================
function mostrarMensagem(msg){
  alert(msg);
}

// ==========================
// Event Listeners
// ==========================
filtroMes.addEventListener('input', atualizarInterface);
window.onload = carregarDados;

// ==========================
// Removendo código de login obsoleto
// ==========================
if(loginSection) loginSection.remove();
if(loginForm) loginForm.remove();
if(btnLogout) btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('logado');
    app.style.display = 'none';
    loginSection.style.display = 'flex';
});
