<div align="center">

# 💰 Finora Desktop

**Sistema de gerenciamento de finanças pessoais**

Aplicação desktop construída com Electron, React e Prisma para controle completo das suas finanças.

[![Electron](https://img.shields.io/badge/Electron-34-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📋 Funcionalidades

| Módulo                     | Descrição                                                                     |
| -------------------------- | ----------------------------------------------------------------------------- |
| **Dashboard**              | Visão geral das finanças com resumo de saldo, receitas e despesas             |
| **Contas**                 | Gerenciamento de contas bancárias (corrente, poupança, cartão, investimentos) |
| **Transações**             | Controle de receitas e despesas com categorização e tags                      |
| **Categorias**             | Organização hierárquica com subcategorias                                     |
| **Fechamentos**            | Histórico de fechamento mensal com balanço                                    |
| **Assinaturas**            | Controle de serviços recorrentes com divisão entre membros                    |
| **Contas a Pagar/Receber** | Gestão de boletos e cobranças com status de pagamento                         |
| **Metas Financeiras**      | Acompanhamento de metas com progresso visual                                  |
| **Distribuição Salarial**  | Regras automáticas de distribuição do salário entre contas                    |

## 🛠️ Tecnologias

| Tecnologia                                                   | Versão | Finalidade                        |
| ------------------------------------------------------------ | ------ | --------------------------------- |
| [Electron](https://www.electronjs.org/)                      | 34     | Aplicação desktop multiplataforma |
| [React](https://react.dev/)                                  | 18     | Interface reativa                 |
| [TypeScript](https://www.typescriptlang.org/)                | 5.7    | Tipagem estática                  |
| [Vite](https://vite.dev/)                                    | 6      | Build e dev server                |
| [Prisma](https://www.prisma.io/)                             | 7      | ORM com SQLite                    |
| [Tailwind CSS](https://tailwindcss.com/)                     | 3.4    | Estilização utility-first         |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | 12     | Driver SQLite nativo              |

## 📁 Estrutura do Projeto

```
finora-desktop/
├── electron/              # Processo principal do Electron
│   ├── main.ts            # Entry point do Electron
│   ├── preload.ts         # Preload script (bridge IPC)
│   └── database.ts        # Configuração do Prisma + queries
├── src/                   # Código fonte React (renderer)
│   ├── components/        # Componentes reutilizáveis (UI + layout)
│   ├── pages/             # Páginas da aplicação
│   ├── types/             # Tipos TypeScript
│   └── lib/               # Utilitários
├── prisma/                # Schema e migrações do banco
│   ├── schema.prisma      # Definição dos modelos
│   ├── seed.ts            # Dados de exemplo
│   └── migrations/        # Histórico de migrações
├── generated/             # Cliente Prisma gerado
├── assets/                # Ícones e recursos estáticos
└── release/               # Executáveis gerados pelo build
```

## ⚡ Quick Start

### Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/finora-desktop.git
cd finora-desktop

# Instale as dependências
npm install

# Configure o banco de dados
npx prisma migrate dev

# (Opcional) Popule com dados de exemplo
npm run db:seed
```

### Desenvolvimento

```bash
# Inicia o Electron com hot reload (Vite + Electron)
npm run electron:dev
```

### Build

```bash
# Gera o executável para distribuição
npm run electron:build
```

O instalador será gerado em `release/`.

## 📜 Comandos Disponíveis

| Comando                  | Descrição                                      |
| ------------------------ | ---------------------------------------------- |
| `npm run dev`            | Inicia apenas o Vite dev server (sem Electron) |
| `npm run electron:dev`   | Inicia Electron + Vite com hot reload          |
| `npm run electron:build` | Gera executável para distribuição              |
| `npm run db:generate`    | Gera o cliente Prisma                          |
| `npm run db:migrate`     | Executa migrações pendentes                    |
| `npm run db:seed`        | Popula o banco com dados de exemplo            |
| `npm run db:studio`      | Abre o Prisma Studio para visualizar dados     |

## 🗄️ Modelo de Dados

O banco utiliza **SQLite** com os seguintes modelos principais:

- **Account** — Contas bancárias (corrente, poupança, cartão, dinheiro, investimento)
- **Transaction** — Receitas e despesas vinculadas a contas e categorias
- **Category** — Categorias hierárquicas (com subcategorias)
- **Tag** — Tags para classificação flexível de transações
- **MonthClosure** — Fechamento mensal consolidado
- **Subscription** — Assinaturas recorrentes com membros e pagamentos
- **Bill** — Contas a pagar e a receber
- **FinancialGoal** — Metas financeiras com progresso
- **SalaryDistribution** — Regras de distribuição salarial entre contas

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
