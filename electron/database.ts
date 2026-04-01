import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient, AccountType, TransactionType } from '../generated/prisma/client/client'

// Re-export types for external use
export type { AccountType, TransactionType }

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// SQL to create tables (from migration)
const CREATE_TABLES_SQL = `
-- CreateTable
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MonthClosure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL UNIQUE,
    "totalIncome" REAL NOT NULL,
    "totalExpense" REAL NOT NULL,
    "balance" REAL NOT NULL,
    "notes" TEXT,
    "closedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "billingDay" INTEGER NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SubscriptionMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "share" REAL NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MemberPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("memberId") REFERENCES "SubscriptionMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SubscriptionPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FinancialGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "targetAmount" REAL NOT NULL,
    "currentAmount" REAL NOT NULL DEFAULT 0,
    "deadline" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TransactionTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TransactionTag_transactionId_tagId_key" ON "TransactionTag"("transactionId", "tagId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "Bill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "categoryId" TEXT,
    "accountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SalaryDistribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salary" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SalaryDistributionRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "percentage" REAL NOT NULL,
    "isOrigin" BOOLEAN NOT NULL DEFAULT false,
    "distributionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("distributionId") REFERENCES "SalaryDistribution" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SalaryDistributionRule_distributionId_accountId_key" ON "SalaryDistributionRule"("distributionId", "accountId");
`

export class DatabaseService {
  private prisma: PrismaClient
  private dbPath: string

  constructor() {
    // In dev: use absolute path to prisma folder
    // In prod: use userData folder
    this.dbPath = isDev
      ? path.resolve(app.getAppPath(), 'prisma', 'dev.db')
      : path.join(app.getPath('userData'), 'finora.db')

    console.log('Database path:', this.dbPath)

    const adapter = new PrismaBetterSqlite3({ url: `file:${this.dbPath}` })
    this.prisma = new PrismaClient({ adapter })
  }

  async initialize() {
    // Check if database exists, if not create tables
    const dbExists = fs.existsSync(this.dbPath)
    console.log('Database exists:', dbExists, 'Path:', this.dbPath)
    
    await this.prisma.$connect()
    
    // Always try to create tables and apply migrations
    console.log('Creating/updating database tables...')
    await this.createTables()
    await this.applyMigrations()
    console.log('Database tables ready')
  }

  private async applyMigrations() {
    // Migration: Add isOwner column to SubscriptionMember if not exists
    try {
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "SubscriptionMember" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;
      `)
      console.log('Migration applied: Added isOwner to SubscriptionMember')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('duplicate column') && !errorMessage.includes('already exists')) {
        // Column might already exist, which is fine
      }
    }

    // Migration: Create MemberPayment table if not exists
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MemberPayment" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "amount" REAL NOT NULL,
          "month" TEXT NOT NULL,
          "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "memberId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("memberId") REFERENCES "SubscriptionMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `)
      console.log('Migration applied: Created MemberPayment table')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('already exists')) {
        console.error('Error creating MemberPayment table:', error)
      }
    }

    // Migration: Add billingCycle column to Subscription if not exists
    try {
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "Subscription" ADD COLUMN "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY';
      `)
      console.log('Migration applied: Added billingCycle to Subscription')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('duplicate column') && !errorMessage.includes('already exists')) {
        // Column might already exist, which is fine
      }
    }
  }

  private async createTables() {
    // Split SQL into individual statements and execute each
    const statements = CREATE_TABLES_SQL
      .split(';')
      .map((s: string) => s.split('\n').filter((line: string) => !line.trim().startsWith('--')).join('\n').trim())
      .filter((s: string) => s.length > 0)
    
    for (const statement of statements) {
      try {
        await this.prisma.$executeRawUnsafe(statement + ';')
      } catch (error: unknown) {
        // Ignore "table already exists" errors
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (!errorMessage.includes('already exists')) {
          console.error('Error executing SQL:', statement, error)
        }
      }
    }
  }

  // ==================== ACCOUNTS ====================
  async getAccounts() {
    return this.prisma.account.findMany({
      orderBy: { name: 'asc' }
    })
  }

  async getAccountById(id: string) {
    return this.prisma.account.findUnique({ where: { id } })
  }

  async createAccount(data: { name: string; type: AccountType; initialBalance?: number }) {
    return this.prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        balance: data.initialBalance ?? 0
      }
    })
  }

  async updateAccount(id: string, data: { name?: string; type?: AccountType }) {
    return this.prisma.account.update({
      where: { id },
      data
    })
  }

  async deleteAccount(id: string) {
    return this.prisma.account.delete({ where: { id } })
  }

  // ==================== CATEGORIES ====================
  async getCategories() {
    return this.prisma.category.findMany({
      include: { parent: true, children: true },
      orderBy: { name: 'asc' }
    })
  }

  async getCategoryById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: { parent: true, children: true }
    })
  }

  async createCategory(data: { name: string; type: TransactionType; parentId?: string }) {
    return this.prisma.category.create({ data })
  }

  async updateCategory(id: string, data: { name?: string; type?: TransactionType; parentId?: string }) {
    return this.prisma.category.update({
      where: { id },
      data
    })
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } })
  }

  // ==================== TRANSACTIONS ====================
  async getTransactions(filters?: { month?: string; accountId?: string; categoryId?: string; type?: TransactionType }) {
    const where: any = {}

    if (filters?.month) {
      const [year, month] = filters.month.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)
      where.date = { gte: startDate, lte: endDate }
    }

    if (filters?.accountId) where.accountId = filters.accountId
    if (filters?.categoryId) where.categoryId = filters.categoryId
    if (filters?.type) where.type = filters.type

    return this.prisma.transaction.findMany({
      where,
      include: { account: true, category: true, tags: { include: { tag: true } } },
      orderBy: { date: 'desc' }
    })
  }

  async getTransactionById(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: { account: true, category: true, tags: { include: { tag: true } } }
    })
  }

  async createTransaction(data: {
    description: string
    amount: number
    type: TransactionType
    date: string
    accountId: string
    categoryId: string
    notes?: string
  }) {
    const transaction = await this.prisma.transaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        date: new Date(data.date),
        accountId: data.accountId,
        categoryId: data.categoryId,
        notes: data.notes
      },
      include: { account: true, category: true, tags: { include: { tag: true } } }
    })

    const balanceChange = data.type === 'INCOME' ? data.amount : -data.amount
    await this.prisma.account.update({
      where: { id: data.accountId },
      data: { balance: { increment: balanceChange } }
    })

    return transaction
  }

  async updateTransaction(id: string, data: {
    description?: string
    amount?: number
    type?: TransactionType
    date?: string
    accountId?: string
    categoryId?: string
    notes?: string
  }) {
    const existing = await this.prisma.transaction.findUnique({ where: { id } })
    if (!existing) throw new Error('Transaction not found')

    const oldBalanceChange = existing.type === 'INCOME' ? -existing.amount : existing.amount
    await this.prisma.account.update({
      where: { id: existing.accountId },
      data: { balance: { increment: oldBalanceChange } }
    })

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined
      },
      include: { account: true, category: true, tags: { include: { tag: true } } }
    })

    const newBalanceChange = updated.type === 'INCOME' ? updated.amount : -updated.amount
    await this.prisma.account.update({
      where: { id: updated.accountId },
      data: { balance: { increment: newBalanceChange } }
    })

    return updated
  }

  async deleteTransaction(id: string) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } })
    if (!transaction) throw new Error('Transaction not found')

    const balanceChange = transaction.type === 'INCOME' ? -transaction.amount : transaction.amount
    await this.prisma.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: balanceChange } }
    })

    return this.prisma.transaction.delete({ where: { id } })
  }

  async getTransactionsSummary(month: string) {
    const [year, m] = month.split('-').map(Number)
    const startDate = new Date(year, m - 1, 1)
    const endDate = new Date(year, m, 0, 23, 59, 59)

    const transactions = await this.prisma.transaction.findMany({
      where: { date: { gte: startDate, lte: endDate } }
    })

    const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)

    return { month, income, expense, balance: income - expense }
  }

  // ==================== MONTH CLOSURES ====================
  async getMonthClosures() {
    return this.prisma.monthClosure.findMany({ orderBy: { month: 'desc' } })
  }

  async getMonthClosureByMonth(month: string) {
    return this.prisma.monthClosure.findUnique({ where: { month } })
  }

  async createMonthClosure(data: { month: string; notes?: string }) {
    const summary = await this.getTransactionsSummary(data.month)
    return this.prisma.monthClosure.create({
      data: {
        month: data.month,
        totalIncome: summary.income,
        totalExpense: summary.expense,
        balance: summary.balance,
        notes: data.notes
      }
    })
  }

  async getMonthClosureStatus(month: string) {
    const closure = await this.prisma.monthClosure.findUnique({ where: { month } })
    const summary = await this.getTransactionsSummary(month)
    return { month, isClosed: !!closure, closedAt: closure?.closedAt, summary }
  }

  // ==================== SUBSCRIPTIONS ====================
  async getSubscriptions() {
    return this.prisma.subscription.findMany({ 
      include: { 
        members: {
          include: { payments: true },
          orderBy: [{ isOwner: 'desc' }, { name: 'asc' }]
        } 
      }, 
      orderBy: { name: 'asc' } 
    })
  }

  async getSubscriptionById(id: string) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: { 
        members: {
          include: { payments: { orderBy: { paidAt: 'desc' } } },
          orderBy: [{ isOwner: 'desc' }, { name: 'asc' }]
        }, 
        payments: { orderBy: { paidAt: 'desc' } } 
      }
    })
  }

  async createSubscription(data: { name: string; totalAmount: number; billingDay: number; billingCycle?: string; isShared?: boolean; members?: { name: string; share: number }[] }) {
    return this.prisma.subscription.create({
      data: {
        name: data.name,
        totalAmount: data.totalAmount,
        billingDay: data.billingDay,
        billingCycle: data.billingCycle ?? 'MONTHLY',
        isShared: data.isShared ?? false,
        members: data.members ? { create: data.members } : undefined
      },
      include: { members: true }
    })
  }

  async updateSubscription(id: string, data: { name?: string; totalAmount?: number; billingDay?: number; billingCycle?: string; isActive?: boolean }) {
    return this.prisma.subscription.update({ where: { id }, data, include: { members: true } })
  }

  async deleteSubscription(id: string) {
    return this.prisma.subscription.delete({ where: { id } })
  }

  async addSubscriptionMember(subscriptionId: string, data: { name: string; share: number; isOwner?: boolean }) {
    return this.prisma.subscriptionMember.create({ 
      data: { 
        name: data.name, 
        share: data.share, 
        isOwner: data.isOwner ?? false,
        subscriptionId 
      },
      include: { payments: true }
    })
  }

  async updateSubscriptionMember(memberId: string, data: { name?: string; share?: number; isOwner?: boolean }) {
    return this.prisma.subscriptionMember.update({ 
      where: { id: memberId }, 
      data,
      include: { payments: true }
    })
  }

  async removeSubscriptionMember(subscriptionId: string, memberId: string) {
    return this.prisma.subscriptionMember.delete({ where: { id: memberId, subscriptionId } })
  }

  async recordMemberPayment(memberId: string, data: { amount: number; month: string }) {
    return this.prisma.memberPayment.create({
      data: {
        amount: data.amount,
        month: data.month,
        memberId
      }
    })
  }

  async getMemberPayments(memberId: string, month?: string) {
    const where: any = { memberId }
    if (month) where.month = month
    return this.prisma.memberPayment.findMany({
      where,
      orderBy: { paidAt: 'desc' }
    })
  }

  async deleteMemberPayment(paymentId: string) {
    return this.prisma.memberPayment.delete({ where: { id: paymentId } })
  }

  async getSubscriptionMembersSummary(subscriptionId: string, month: string) {
    const subscription = await this.getSubscriptionById(subscriptionId)
    if (!subscription) throw new Error('Subscription not found')
    
    const membersSummary = subscription.members?.map(member => {
      const amountDue = (subscription.totalAmount * member.share) / 100
      const paidThisMonth = member.payments?.filter(p => p.month === month)
        .reduce((sum, p) => sum + p.amount, 0) ?? 0
      return {
        ...member,
        amountDue,
        paidThisMonth,
        isPaid: paidThisMonth >= amountDue,
        pendingAmount: Math.max(0, amountDue - paidThisMonth)
      }
    }) ?? []

    const totalDue = subscription.totalAmount
    const totalPaid = membersSummary.reduce((sum, m) => sum + m.paidThisMonth, 0)
    const totalPending = membersSummary.reduce((sum, m) => sum + m.pendingAmount, 0)

    return {
      subscription,
      month,
      members: membersSummary,
      totalDue,
      totalPaid,
      totalPending,
      isFullyPaid: totalPending === 0
    }
  }

  // ==================== FINANCIAL GOALS ====================
  async getFinancialGoals() {
    return this.prisma.financialGoal.findMany({ orderBy: { deadline: 'asc' } })
  }

  async getFinancialGoalById(id: string) {
    return this.prisma.financialGoal.findUnique({ where: { id } })
  }

  async createFinancialGoal(data: { name: string; targetAmount: number; deadline: string; currentAmount?: number }) {
    return this.prisma.financialGoal.create({
      data: { name: data.name, targetAmount: data.targetAmount, deadline: new Date(data.deadline), currentAmount: data.currentAmount ?? 0 }
    })
  }

  async updateFinancialGoal(id: string, data: { name?: string; targetAmount?: number; deadline?: string; currentAmount?: number }) {
    return this.prisma.financialGoal.update({
      where: { id },
      data: { ...data, deadline: data.deadline ? new Date(data.deadline) : undefined }
    })
  }

  async deleteFinancialGoal(id: string) {
    return this.prisma.financialGoal.delete({ where: { id } })
  }

  async addGoalProgress(id: string, amount: number) {
    return this.prisma.financialGoal.update({ where: { id }, data: { currentAmount: { increment: amount } } })
  }

  // ==================== DASHBOARD ====================
  async getDashboardSummary() {
    const accounts = await this.prisma.account.findMany()
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
    const now = new Date()
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
    const summary = await this.getTransactionsSummary(currentMonth)
    const goals = await this.prisma.financialGoal.findMany({ take: 5, orderBy: { deadline: 'asc' } })
    const recentTransactions = await this.prisma.transaction.findMany({ include: { account: true, category: true, tags: { include: { tag: true } } }, orderBy: { date: 'desc' }, take: 5 })
    const upcomingBills = await this.getUpcomingBills(7)
    const subscriptionAlerts = await this.getSubscriptionAlerts(7)
    return { totalBalance, monthSummary: summary, accounts, activeGoals: goals, recentTransactions, upcomingBills, subscriptionAlerts }
  }

  // ==================== TAGS ====================
  async getTags() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } })
  }

  async createTag(data: { name: string; color?: string }) {
    return this.prisma.tag.create({ data: { name: data.name, color: data.color ?? '#6366f1' } })
  }

  async updateTag(id: string, data: { name?: string; color?: string }) {
    return this.prisma.tag.update({ where: { id }, data })
  }

  async deleteTag(id: string) {
    return this.prisma.tag.delete({ where: { id } })
  }

  async addTagToTransaction(transactionId: string, tagId: string) {
    return this.prisma.transactionTag.create({
      data: { transactionId, tagId },
      include: { tag: true }
    })
  }

  async removeTagFromTransaction(transactionId: string, tagId: string) {
    return this.prisma.transactionTag.deleteMany({
      where: { transactionId, tagId }
    })
  }

  async setTransactionTags(transactionId: string, tagIds: string[]) {
    // Remove all existing, then add new ones
    await this.prisma.transactionTag.deleteMany({ where: { transactionId } })
    if (tagIds.length > 0) {
      await this.prisma.transactionTag.createMany({
        data: tagIds.map(tagId => ({ transactionId, tagId }))
      })
    }
    return this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { account: true, category: true, tags: { include: { tag: true } } }
    })
  }

  // ==================== BILLS ====================
  async getBills(filters?: { type?: string; isPaid?: boolean; month?: string }) {
    const where: any = {}
    if (filters?.type) where.type = filters.type
    if (filters?.isPaid !== undefined) where.isPaid = filters.isPaid
    if (filters?.month) {
      const [year, month] = filters.month.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)
      where.dueDate = { gte: startDate, lte: endDate }
    }
    return this.prisma.bill.findMany({
      where,
      orderBy: { dueDate: 'asc' }
    })
  }

  async getBillById(id: string) {
    return this.prisma.bill.findUnique({ where: { id } })
  }

  async createBill(data: {
    description: string
    amount: number
    type: string
    dueDate: string
    isRecurring?: boolean
    notes?: string
    categoryId?: string
    accountId?: string
  }) {
    return this.prisma.bill.create({
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        dueDate: new Date(data.dueDate),
        isRecurring: data.isRecurring ?? false,
        notes: data.notes,
        categoryId: data.categoryId,
        accountId: data.accountId
      }
    })
  }

  async updateBill(id: string, data: {
    description?: string
    amount?: number
    type?: string
    dueDate?: string
    isPaid?: boolean
    isRecurring?: boolean
    notes?: string
    categoryId?: string
    accountId?: string
  }) {
    return this.prisma.bill.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        paidAt: data.isPaid ? new Date() : data.isPaid === false ? null : undefined
      }
    })
  }

  async deleteBill(id: string) {
    return this.prisma.bill.delete({ where: { id } })
  }

  async markBillAsPaid(id: string) {
    return this.prisma.bill.update({
      where: { id },
      data: { isPaid: true, paidAt: new Date() }
    })
  }

  async markBillAsUnpaid(id: string) {
    return this.prisma.bill.update({
      where: { id },
      data: { isPaid: false, paidAt: null }
    })
  }

  async getUpcomingBills(days: number = 7) {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    return this.prisma.bill.findMany({
      where: {
        isPaid: false,
        dueDate: { gte: now, lte: futureDate }
      },
      orderBy: { dueDate: 'asc' }
    })
  }

  async getOverdueBills() {
    return this.prisma.bill.findMany({
      where: {
        isPaid: false,
        dueDate: { lt: new Date() }
      },
      orderBy: { dueDate: 'asc' }
    })
  }

  // ==================== SUBSCRIPTION ALERTS ====================
  async getSubscriptionAlerts(days: number = 7) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { isActive: true },
      include: { members: true }
    })

    const now = new Date()
    const alerts: Array<{ subscription: any; daysUntilBilling: number; nextBillingDate: string }> = []

    for (const sub of subscriptions) {
      let nextBilling: Date

      if (sub.billingCycle === 'ANNUAL') {
        // For annual, calculate based on creation month + billingDay
        const createdMonth = new Date(sub.createdAt).getMonth()
        nextBilling = new Date(now.getFullYear(), createdMonth, sub.billingDay)
        if (nextBilling <= now) {
          nextBilling = new Date(now.getFullYear() + 1, createdMonth, sub.billingDay)
        }
      } else {
        // Monthly
        nextBilling = new Date(now.getFullYear(), now.getMonth(), sub.billingDay)
        if (nextBilling <= now) {
          nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, sub.billingDay)
        }
      }

      const diffMs = nextBilling.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays <= days && diffDays >= 0) {
        alerts.push({
          subscription: sub,
          daysUntilBilling: diffDays,
          nextBillingDate: nextBilling.toISOString()
        })
      }
    }

    return alerts.sort((a, b) => a.daysUntilBilling - b.daysUntilBilling)
  }

  // ==================== SALARY DISTRIBUTION ====================
  async getSalaryDistribution() {
    return this.prisma.salaryDistribution.findFirst({
      include: {
        rules: {
          include: { account: true },
          orderBy: [{ isOrigin: 'desc' }, { createdAt: 'asc' }]
        }
      }
    })
  }

  async saveSalaryDistribution(data: {
    salary: number
    rules: { accountId: string; percentage: number; isOrigin: boolean }[]
  }) {
    const existing = await this.prisma.salaryDistribution.findFirst()

    if (existing) {
      // Delete old rules and update
      await this.prisma.salaryDistributionRule.deleteMany({
        where: { distributionId: existing.id }
      })
      return this.prisma.salaryDistribution.update({
        where: { id: existing.id },
        data: {
          salary: data.salary,
          rules: {
            create: data.rules.map(rule => ({
              accountId: rule.accountId,
              percentage: rule.percentage,
              isOrigin: rule.isOrigin
            }))
          }
        },
        include: {
          rules: {
            include: { account: true },
            orderBy: [{ isOrigin: 'desc' }, { createdAt: 'asc' }]
          }
        }
      })
    } else {
      return this.prisma.salaryDistribution.create({
        data: {
          salary: data.salary,
          rules: {
            create: data.rules.map(rule => ({
              accountId: rule.accountId,
              percentage: rule.percentage,
              isOrigin: rule.isOrigin
            }))
          }
        },
        include: {
          rules: {
            include: { account: true },
            orderBy: [{ isOrigin: 'desc' }, { createdAt: 'asc' }]
          }
        }
      })
    }
  }

  async deleteSalaryDistribution() {
    const existing = await this.prisma.salaryDistribution.findFirst()
    if (existing) {
      return this.prisma.salaryDistribution.delete({ where: { id: existing.id } })
    }
    return null
  }
}