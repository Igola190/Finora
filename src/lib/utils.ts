import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    CHECKING: "Conta Corrente",
    SAVINGS: "Poupança",
    CREDIT_CARD: "Cartão de Crédito",
    CASH: "Dinheiro",
    INVESTMENT: "Investimento",
  };
  return labels[type] || type;
}

export function getTransactionTypeLabel(type: string): string {
  return type === "INCOME" ? "Receita" : "Despesa";
}
