import { AccountType, PrismaClient, TransactionType } from "../generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.subscriptionPayment.deleteMany();
  await prisma.subscriptionMember.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.monthClosure.deleteMany();
  await prisma.financialGoal.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();

  // Create Accounts
  const checking = await prisma.account.create({
    data: {
      name: "Conta Corrente Nubank",
      type: AccountType.CHECKING,
      balance: 5000,
    },
  });
  const savings = await prisma.account.create({
    data: { name: "Poupança Inter", type: AccountType.SAVINGS, balance: 15000 },
  });
  const creditCard = await prisma.account.create({
    data: {
      name: "Cartão Nubank",
      type: AccountType.CREDIT_CARD,
      balance: -1200,
    },
  });
  const wallet = await prisma.account.create({
    data: { name: "Carteira", type: AccountType.CASH, balance: 350 },
  });

  console.log("✅ Accounts created");

  // Create Categories
  const salary = await prisma.category.create({
    data: { name: "Salário", type: TransactionType.INCOME },
  });
  const freelance = await prisma.category.create({
    data: { name: "Freelance", type: TransactionType.INCOME },
  });
  const investments = await prisma.category.create({
    data: { name: "Rendimentos", type: TransactionType.INCOME },
  });

  const food = await prisma.category.create({
    data: { name: "Alimentação", type: TransactionType.EXPENSE },
  });
  const restaurant = await prisma.category.create({
    data: {
      name: "Restaurantes",
      type: TransactionType.EXPENSE,
      parentId: food.id,
    },
  });
  const groceries = await prisma.category.create({
    data: {
      name: "Supermercado",
      type: TransactionType.EXPENSE,
      parentId: food.id,
    },
  });

  const transport = await prisma.category.create({
    data: { name: "Transporte", type: TransactionType.EXPENSE },
  });
  const uber = await prisma.category.create({
    data: {
      name: "Uber/99",
      type: TransactionType.EXPENSE,
      parentId: transport.id,
    },
  });
  const fuel = await prisma.category.create({
    data: {
      name: "Combustível",
      type: TransactionType.EXPENSE,
      parentId: transport.id,
    },
  });

  const housing = await prisma.category.create({
    data: { name: "Moradia", type: TransactionType.EXPENSE },
  });
  const rent = await prisma.category.create({
    data: {
      name: "Aluguel",
      type: TransactionType.EXPENSE,
      parentId: housing.id,
    },
  });
  const utilities = await prisma.category.create({
    data: {
      name: "Contas (Luz/Água/Gás)",
      type: TransactionType.EXPENSE,
      parentId: housing.id,
    },
  });

  const entertainment = await prisma.category.create({
    data: { name: "Lazer", type: TransactionType.EXPENSE },
  });
  const streaming = await prisma.category.create({
    data: {
      name: "Streaming",
      type: TransactionType.EXPENSE,
      parentId: entertainment.id,
    },
  });

  const health = await prisma.category.create({
    data: { name: "Saúde", type: TransactionType.EXPENSE },
  });

  console.log("✅ Categories created");

  // Create Transactions (current month)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  await prisma.transaction.createMany({
    data: [
      {
        description: "Salário Janeiro",
        amount: 8500,
        type: TransactionType.INCOME,
        date: new Date(currentYear, currentMonth, 5),
        accountId: checking.id,
        categoryId: salary.id,
      },
      {
        description: "Projeto Freelance",
        amount: 2000,
        type: TransactionType.INCOME,
        date: new Date(currentYear, currentMonth, 15),
        accountId: checking.id,
        categoryId: freelance.id,
      },
      {
        description: "Rendimento Poupança",
        amount: 75.5,
        type: TransactionType.INCOME,
        date: new Date(currentYear, currentMonth, 1),
        accountId: savings.id,
        categoryId: investments.id,
      },
      {
        description: "Aluguel",
        amount: 2500,
        type: TransactionType.EXPENSE,
        date: new Date(currentYear, currentMonth, 10),
        accountId: checking.id,
        categoryId: rent.id,
      },
      {
        description: "Supermercado Extra",
        amount: 450,
        type: TransactionType.EXPENSE,
        date: new Date(currentYear, currentMonth, 12),
        accountId: creditCard.id,
        categoryId: groceries.id,
      },
      {
        description: "iFood",
        amount: 89.9,
        type: TransactionType.EXPENSE,
        date: new Date(currentYear, currentMonth, 18),
        accountId: creditCard.id,
        categoryId: restaurant.id,
      },
      {
        description: "Uber",
        amount: 35.5,
        type: TransactionType.EXPENSE,
        date: new Date(currentYear, currentMonth, 20),
        accountId: creditCard.id,
        categoryId: uber.id,
      },
      {
        description: "Conta de Luz",
        amount: 180,
        type: TransactionType.EXPENSE,
        date: new Date(currentYear, currentMonth, 15),
        accountId: checking.id,
        categoryId: utilities.id,
      },
      {
        description: "Netflix",
        amount: 55.9,
        type: TransactionType.EXPENSE,
        date: new Date(currentYear, currentMonth, 5),
        accountId: creditCard.id,
        categoryId: streaming.id,
      },
      {
        description: "Farmácia",
        amount: 120,
        type: TransactionType.EXPENSE,
        date: new Date(currentYear, currentMonth, 22),
        accountId: wallet.id,
        categoryId: health.id,
      },
    ],
  });

  console.log("✅ Transactions created");

  // Create Subscriptions
  const netflix = await prisma.subscription.create({
    data: {
      name: "Netflix Premium",
      totalAmount: 55.9,
      billingDay: 5,
      isShared: true,
      members: {
        create: [
          { name: "Eu", share: 50 },
          { name: "João", share: 25 },
          { name: "Maria", share: 25 },
        ],
      },
    },
  });

  await prisma.subscription.create({
    data: {
      name: "Spotify Família",
      totalAmount: 34.9,
      billingDay: 10,
      isShared: true,
      members: {
        create: [
          { name: "Eu", share: 40 },
          { name: "Irmão", share: 30 },
          { name: "Primo", share: 30 },
        ],
      },
    },
  });

  await prisma.subscription.create({
    data: {
      name: "Amazon Prime",
      totalAmount: 19.9,
      billingDay: 15,
      isShared: false,
    },
  });

  await prisma.subscription.create({
    data: {
      name: "iCloud 200GB",
      totalAmount: 10.9,
      billingDay: 20,
      isShared: false,
    },
  });

  console.log("✅ Subscriptions created");

  // Create Financial Goals
  await prisma.financialGoal.create({
    data: {
      name: "Reserva de Emergência",
      targetAmount: 30000,
      currentAmount: 15000,
      deadline: new Date(currentYear, 11, 31),
    },
  });

  await prisma.financialGoal.create({
    data: {
      name: "Viagem Europa",
      targetAmount: 20000,
      currentAmount: 5500,
      deadline: new Date(currentYear + 1, 6, 1),
    },
  });

  await prisma.financialGoal.create({
    data: {
      name: "MacBook Pro",
      targetAmount: 15000,
      currentAmount: 8000,
      deadline: new Date(currentYear, 5, 30),
    },
  });

  await prisma.financialGoal.create({
    data: {
      name: "Curso de Inglês",
      targetAmount: 5000,
      currentAmount: 2000,
      deadline: new Date(currentYear, 2, 1),
    },
  });

  console.log("✅ Financial Goals created");

  console.log("🎉 Seed completed!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
