# Controle de Caixa — EMEI Criança Feliz

Sistema web desenvolvido como parte de uma Atividade Extensionista do curso de Análise e Desenvolvimento de Sistemas da UNINTER, com o objetivo de auxiliar na organização, no registro e na consulta das movimentações financeiras do CPM da EMEI Criança Feliz.

## Sobre o projeto

O projeto foi desenvolvido a partir de uma necessidade observada no contexto da comunidade escolar: facilitar a organização das informações relacionadas ao controle financeiro.

A aplicação permite registrar receitas e despesas, consultar movimentações, organizar fornecedores e acompanhar os dados por meio de indicadores, gráficos e relatórios.

O desenvolvimento do sistema também possibilitou a aplicação prática de conhecimentos adquiridos ao longo da graduação, especialmente nas áreas de desenvolvimento web, programação, banco de dados e construção de interfaces.

## Funcionalidades

### Controle financeiro

- Cadastro de entradas e saídas
- Registro de descrição, valor, data e fornecedor/origem
- Edição e exclusão de lançamentos
- Atualização dos dados em tempo real

### Relatórios e acompanhamento

- Indicadores de entradas, saídas e saldo
- Filtro mensal
- Resumo anual por ano selecionado
- Gráfico mensal
- Gráfico anual
- Relatórios preparados para impressão

### Fornecedores

- Cadastro de fornecedores
- Associação de fornecedores às movimentações
- Remoção de fornecedores

### Interface

- Interface responsiva
- Compatibilidade com computadores e dispositivos móveis
- Organização das informações com foco em facilidade de consulta e utilização

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript (ES Modules)
- Firebase Firestore 12.19.0
- Chart.js 4.5.1
- GitHub Pages

## Estrutura de dados

O sistema utiliza duas coleções principais no Firebase Firestore.

### `transacoes`

- `descricao`: string
- `valor`: number
- `tipo`: `entrada` ou `saida`
- `data`: string no formato `YYYY-MM-DD`
- `fornecedor`: string ou `null`

### `fornecedores`

- `nome`: string

## Execução local

Como o projeto utiliza módulos JavaScript e Firebase, recomenda-se executá-lo por meio de um servidor HTTP local.

No Visual Studio Code, o Live Server pode ser utilizado para essa finalidade.

Não abra o arquivo `index.html` diretamente pelo Windows (`file://`), pois isso pode impedir o carregamento de módulos JavaScript e de outros recursos utilizados pela aplicação.

## Firebase e segurança

A aplicação utiliza o Firebase Firestore para armazenamento e sincronização dos dados.

A configuração do Firebase presente no front-end é necessária para a conexão com o serviço, mas não substitui as regras de segurança do Firestore.

Para utilização com dados reais, devem ser configuradas regras adequadas de acesso, permitindo operações somente a usuários autorizados.

## Publicação

O projeto está disponível no GitHub e pode ser publicado por meio do GitHub Pages.

Repositório:

https://github.com/eduardaroesch/controle-financeiro

## Contexto extensionista

O sistema foi desenvolvido no contexto de uma Atividade Extensionista da UNINTER, buscando aproximar os conhecimentos adquiridos durante a graduação de uma necessidade identificada na comunidade local.

A proposta está relacionada aos seguintes Objetivos de Desenvolvimento Sustentável (ODS) da ONU:

**ODS 4 — Educação de Qualidade**

A iniciativa contribui para a aplicação prática de conhecimentos tecnológicos em benefício do ambiente escolar e da comunidade.

**ODS 16 — Paz, Justiça e Instituições Eficazes**

A proposta está relacionada à organização e à transparência das informações no contexto institucional.

## Autoria

Projeto desenvolvido como parte da formação acadêmica em Análise e Desenvolvimento de Sistemas — UNINTER.

EMEI Criança Feliz — Sinimbu/RS.
