# Controle de Caixa — EMEI Criança Feliz

Sistema web de controle de caixa desenvolvido para uma Atividade Extensionista do curso de Análise e Desenvolvimento de Sistemas da UNINTER, com foco em facilitar o registro, a consulta e a apresentação das movimentações financeiras da EMEI Criança Feliz.

## Funcionalidades

- Cadastro de entradas e saídas.
- Seleção de fornecedor/origem.
- Atualização dos dados em tempo real com Firebase Firestore.
- Edição e exclusão de lançamentos.
- Cadastro e remoção de fornecedores.
- Filtro mensal.
- Resumo anual por ano selecionado.
- Indicadores de entradas, saídas e saldo.
- Gráficos mensal e anual com Chart.js.
- Relatórios preparados para impressão.
- Interface responsiva para desktop e celular.

## Tecnologias

- HTML5
- CSS3
- JavaScript (ES Modules)
- Firebase Firestore 12.19.0
- Chart.js 4.5.1
- GitHub Pages

## Estrutura de dados

O sistema utiliza duas coleções do Firestore:

### `transacoes`

Campos utilizados:

- `descricao`: string
- `valor`: number
- `tipo`: `entrada` ou `saida`
- `data`: string no formato `YYYY-MM-DD`
- `fornecedor`: string ou `null`

### `fornecedores`

Campos utilizados:

- `nome`: string

## Execução local

Como o projeto utiliza módulos JavaScript e Firebase, execute-o por um servidor HTTP local. No VS Code, o Live Server é uma opção simples.

Não abra o `index.html` diretamente pelo Explorer do Windows (`file://`), pois isso pode bloquear o carregamento de módulos e recursos externos.

## Firebase e segurança

A configuração do Firebase presente no front-end não substitui regras de segurança. Antes de utilizar dados reais, configure as regras do Firestore para permitir somente as operações de usuários autorizados. O repositório não deve ser considerado seguro apenas por conter uma configuração de Firebase no código.

## Publicação

O projeto pode ser publicado no GitHub Pages. O endereço publicado depende da configuração de Pages do repositório.

## Contexto extensionista

A solução foi criada para apoiar uma necessidade prática de organização financeira e transparência na prestação de contas, com relação aos ODS 4 (Educação de Qualidade) e 16 (Paz, Justiça e Instituições Eficazes).
