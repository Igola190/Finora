# Finora Desktop

Sistema de gerenciamento de financas pessoais em Electron.

## Funcionalidades

- **Dashboard** - Visao geral das financas
- **Contas** - Gerenciamento de contas bancarias
- **Transacoes** - Controle de receitas e despesas
- **Categorias** - Organizacao hierarquica
- **Fechamentos** - Historico mensal
- **Assinaturas** - Controle de servicos recorrentes com divisao
- **Metas** - Acompanhamento de metas financeiras

## Tecnologias

- **Electron** - Aplicacao desktop multiplataforma
- **React 18** - Interface reativa
- **TypeScript** - Tipagem estatica
- **Vite** - Build e dev server
- **Prisma** - ORM com SQLite
- **Tailwind CSS** - Estilizacao

## Quick Start

```bash
# Instalar dependencias
npm install

# Configurar banco de dados
npx prisma migrate dev
npm run db:seed

# Rodar em desenvolvimento
npm run dev
```

Em outra janela de terminal:

```bash
# Iniciar Electron
npm run electron:dev
```

## Build

```bash
# Gerar executavel
npm run electron:build
```

O instalador sera gerado em `release/`.

## Comandos

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Inicia Vite dev server |
| `npm run electron:dev` | Inicia Electron + Vite |
| `npm run electron:build` | Gera executavel |
| `npm run db:seed` | Popula banco com dados de exemplo |
| `npm run db:studio` | Abre Prisma Studio |

