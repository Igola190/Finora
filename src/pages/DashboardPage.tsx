import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatCurrency,
  formatDate,
  formatMonth,
  getAccountTypeLabel,
  getCurrentMonth,
} from "@/lib/utils";
import type { DashboardSummary } from "@/types";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Receipt,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const summary = await window.api.dashboard.getSummary();
      setData(summary);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground">
        Erro ao carregar dados. Tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das suas finanças - {formatMonth(getCurrentMonth())}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${data.totalBalance >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {formatCurrency(data.totalBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receitas do Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(data.monthSummary.income)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas do Mês
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(data.monthSummary.expense)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Balanço do Mês
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${data.monthSummary.balance >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {formatCurrency(data.monthSummary.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Contas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getAccountTypeLabel(account.type)}
                    </p>
                  </div>
                  <div
                    className={`font-bold ${account.balance >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {formatCurrency(account.balance)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Metas Financeiras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.activeGoals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{goal.name}</p>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress value={progress} />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span>{formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${transaction.type === "INCOME" ? "bg-green-500/10" : "bg-red-500/10"}`}
                  >
                    {transaction.type === "INCOME" ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.category?.name} •{" "}
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <div
                  className={`font-bold ${transaction.type === "INCOME" ? "text-green-500" : "text-red-500"}`}
                >
                  {transaction.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bills & Subscription Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Bills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingBills && data.upcomingBills.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingBills.map((bill) => {
                  const dueDate = new Date(bill.dueDate);
                  const today = new Date(new Date().toDateString());
                  const diffDays = Math.ceil(
                    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
                  );
                  const isOverdue = diffDays < 0;
                  return (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full p-2 ${isOverdue ? "bg-orange-500/10" : bill.type === "RECEIVABLE" ? "bg-green-500/10" : "bg-red-500/10"}`}
                        >
                          {isOverdue ? (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          ) : bill.type === "RECEIVABLE" ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{bill.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {isOverdue
                              ? `Vencida há ${Math.abs(diffDays)} dia(s)`
                              : diffDays === 0
                                ? "Vence hoje"
                                : `Vence em ${diffDays} dia(s)`}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`font-bold ${bill.type === "RECEIVABLE" ? "text-green-500" : "text-red-500"}`}
                      >
                        {formatCurrency(bill.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma conta próxima do vencimento
              </p>
            )}
          </CardContent>
        </Card>

        {/* Subscription Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas de Assinaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.subscriptionAlerts && data.subscriptionAlerts.length > 0 ? (
              <div className="space-y-3">
                {data.subscriptionAlerts.map((alert) => (
                  <div
                    key={alert.subscription.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${alert.daysUntilBilling <= 3 ? "bg-orange-500/10" : "bg-blue-500/10"}`}
                      >
                        <Bell
                          className={`h-4 w-4 ${alert.daysUntilBilling <= 3 ? "text-orange-500" : "text-blue-500"}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">
                          {alert.subscription.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {alert.daysUntilBilling === 0
                            ? "Cobra hoje"
                            : `Cobra em ${alert.daysUntilBilling} dia(s)`}
                          {" • "}
                          {alert.subscription.billingCycle === "ANNUAL"
                            ? "Anual"
                            : "Mensal"}
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-foreground">
                      {formatCurrency(alert.subscription.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma assinatura próxima da cobrança
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
