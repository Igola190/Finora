export type AccountType =
  | "CHECKING"
  | "SAVINGS"
  | "CREDIT_CARD"
  | "CASH"
  | "INVESTMENT";
export type TransactionType = "INCOME" | "EXPENSE";
export type BillingCycle = "MONTHLY" | "ANNUAL";
export type BillType = "PAYABLE" | "RECEIVABLE";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  parentId: string | null;
  parent?: Category | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  notes: string | null;
  accountId: string;
  account?: Account;
  categoryId: string;
  category?: Category;
  tags?: TransactionTag[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionTag {
  id: string;
  transactionId: string;
  tagId: string;
  tag?: Tag;
  createdAt: string;
}

export interface MonthClosure {
  id: string;
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  notes: string | null;
  closedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberPayment {
  id: string;
  amount: number;
  month: string;
  paidAt: string;
  memberId: string;
  createdAt: string;
}

export interface SubscriptionMember {
  id: string;
  name: string;
  share: number;
  isOwner: boolean;
  subscriptionId: string;
  payments?: MemberPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPayment {
  id: string;
  amount: number;
  paidAt: string;
  subscriptionId: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  totalAmount: number;
  billingDay: number;
  billingCycle: BillingCycle;
  isShared: boolean;
  isActive: boolean;
  members?: SubscriptionMember[];
  payments?: SubscriptionPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthSummary {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface DashboardSummary {
  totalBalance: number;
  monthSummary: MonthSummary;
  accounts: Account[];
  activeGoals: FinancialGoal[];
  recentTransactions: Transaction[];
  upcomingBills: Bill[];
  subscriptionAlerts: SubscriptionAlert[];
}

// DTOs
export interface CreateAccountDto {
  name: string;
  type: AccountType;
  initialBalance?: number;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
}

export interface CreateCategoryDto {
  name: string;
  type: TransactionType;
  parentId?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  type?: TransactionType;
  parentId?: string;
}

export interface CreateTransactionDto {
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  accountId: string;
  categoryId: string;
  notes?: string;
}

export interface UpdateTransactionDto {
  description?: string;
  amount?: number;
  type?: TransactionType;
  date?: string;
  accountId?: string;
  categoryId?: string;
  notes?: string;
}

export interface CreateSubscriptionDto {
  name: string;
  totalAmount: number;
  billingDay: number;
  billingCycle?: BillingCycle;
  isShared?: boolean;
  members?: { name: string; share: number }[];
}

export interface UpdateSubscriptionDto {
  name?: string;
  totalAmount?: number;
  billingDay?: number;
  billingCycle?: BillingCycle;
  isActive?: boolean;
}

export interface CreateFinancialGoalDto {
  name: string;
  targetAmount: number;
  deadline: string;
  currentAmount?: number;
}

export interface UpdateFinancialGoalDto {
  name?: string;
  targetAmount?: number;
  deadline?: string;
  currentAmount?: number;
}

export interface TransactionFilters {
  month?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
}

export interface Bill {
  id: string;
  description: string;
  amount: number;
  type: BillType;
  dueDate: string;
  isPaid: boolean;
  paidAt: string | null;
  isRecurring: boolean;
  notes: string | null;
  categoryId: string | null;
  accountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillDto {
  description: string;
  amount: number;
  type: BillType;
  dueDate: string;
  isRecurring?: boolean;
  notes?: string;
  categoryId?: string;
  accountId?: string;
}

export interface UpdateBillDto {
  description?: string;
  amount?: number;
  type?: BillType;
  dueDate?: string;
  isPaid?: boolean;
  isRecurring?: boolean;
  notes?: string;
  categoryId?: string;
  accountId?: string;
}

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

export interface SubscriptionAlert {
  subscription: Subscription;
  daysUntilBilling: number;
  nextBillingDate: Date;
}

// Salary Distribution
export interface SalaryDistributionRule {
  id: string;
  percentage: number;
  isOrigin: boolean;
  distributionId: string;
  accountId: string;
  account?: Account;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryDistribution {
  id: string;
  salary: number;
  rules?: SalaryDistributionRule[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveSalaryDistributionDto {
  salary: number;
  rules: {
    accountId: string;
    percentage: number;
    isOrigin: boolean;
  }[];
}
