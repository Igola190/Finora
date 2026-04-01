import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, getAccountTypeLabel } from "@/lib/utils";
import type { Account, SaveSalaryDistributionDto } from "@/types";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

interface LocalRule {
  accountId: string;
  percentage: number;
  isOrigin: boolean;
}

export function SalaryDistributionPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [salary, setSalary] = useState<number>(0);
  const [rules, setRules] = useState<LocalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [accountsData, distribution] = await Promise.all([
        window.api.accounts.getAll(),
        window.api.salaryDistribution.get(),
      ]);
      setAccounts(accountsData);

      if (distribution) {
        setSalary(distribution.salary);
        // Filter out rules referencing deleted accounts
        const validRules = (distribution.rules || []).filter((r: any) =>
          accountsData.some((a: Account) => a.id === r.accountId),
        );
        setRules(
          validRules.map((r: any) => ({
            accountId: r.accountId,
            percentage: r.percentage,
            isOrigin: r.isOrigin,
          })),
        );
      }
    } catch (error) {
      addToast({
        title: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Derived state
  const nonOriginRules = rules.filter((r) => !r.isOrigin);
  const totalPercentage = nonOriginRules.reduce(
    (sum, r) => sum + r.percentage,
    0,
  );
  const isValidPercentage =
    nonOriginRules.length > 0 && Math.abs(totalPercentage - 100) < 0.01;
  const originCount = rules.filter((r) => r.isOrigin).length;
  const usedIds = rules.map((r) => r.accountId).filter(Boolean);
  const hasDuplicateAccounts = new Set(usedIds).size !== usedIds.length;
  const hasEmptyAccounts = rules.some((r) => !r.accountId);
  const isValid =
    salary > 0 &&
    rules.length > 0 &&
    isValidPercentage &&
    originCount <= 1 &&
    !hasDuplicateAccounts &&
    !hasEmptyAccounts;

  const originAccount = rules.find((r) => r.isOrigin);
  const originAccountData = originAccount
    ? accounts.find((a) => a.id === originAccount.accountId)
    : null;

  function availableAccountsFor(index: number) {
    const usedByOthers = rules
      .filter((_, i) => i !== index)
      .map((r) => r.accountId)
      .filter(Boolean);
    return accounts.filter((a) => !usedByOthers.includes(a.id));
  }

  function addRule() {
    setRules([...rules, { accountId: "", percentage: 0, isOrigin: false }]);
  }

  function removeRule(index: number) {
    setRules(rules.filter((_, i) => i !== index));
  }

  function updateRule(index: number, updates: Partial<LocalRule>) {
    setRules(
      rules.map((r, i) => {
        if (i !== index) {
          if (updates.isOrigin && r.isOrigin) {
            return { ...r, isOrigin: false };
          }
          return r;
        }
        const updated = { ...r, ...updates };
        if (updated.isOrigin) {
          updated.percentage = 0;
        }
        return updated;
      }),
    );
  }

  function handleReset() {
    setSalary(0);
    setRules([]);
  }

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      const dto: SaveSalaryDistributionDto = {
        salary,
        rules: rules.map((r) => ({
          accountId: r.accountId,
          percentage: r.percentage,
          isOrigin: r.isOrigin,
        })),
      };
      await window.api.salaryDistribution.save(dto);
      addToast({ title: "Distribuição salva com sucesso!", variant: "success" });
    } catch (error) {
      addToast({
        title: "Erro ao salvar distribuição",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Distribuição de Salário</h1>
          <p className="text-muted-foreground">
            Distribua seu salário automaticamente entre suas contas
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-secondary p-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Nenhuma conta cadastrada</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Cadastre suas contas bancárias na página de Contas antes de
              configurar a distribuição salarial.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Distribuição de Salário</h1>
          <p className="text-muted-foreground">
            Distribua seu salário automaticamente entre suas contas
          </p>
        </div>
        <div className="flex gap-2">
          {rules.length > 0 && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
          <Button onClick={handleSave} disabled={!isValid || saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Salary + Rules */}
        <div className="space-y-6 lg:col-span-2">
          {/* Salary Input */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Banknote className="h-5 w-5 text-green-500" />
                Valor do Salário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-muted-foreground">
                  R$
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={salary || ""}
                  onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="max-w-[240px] text-2xl font-bold"
                />
              </div>
              {salary > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Salário bruto: <span className="font-medium text-foreground">{formatCurrency(salary)}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rules Configuration */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">Configuração das Contas</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addRule}
                disabled={rules.length >= accounts.length}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Conta
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 rounded-full bg-secondary p-3">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium">Nenhuma conta adicionada</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Adicione contas e defina as porcentagens para distribuir seu
                    salário automaticamente.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={addRule}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Primeira Conta
                  </Button>
                </div>
              ) : (
                <>
                  {rules.map((rule, index) => {
                    const available = availableAccountsFor(index);
                    const selectedAccount = accounts.find(
                      (a) => a.id === rule.accountId,
                    );
                    const calculatedValue =
                      salary > 0 && !rule.isOrigin
                        ? (salary * rule.percentage) / 100
                        : 0;

                    return (
                      <div
                        key={index}
                        className={`group relative rounded-lg border p-4 transition-colors ${
                          rule.isOrigin
                            ? "border-blue-500/30 bg-blue-500/5"
                            : "border-border bg-card hover:border-border/80"
                        }`}
                      >
                        <div className="flex flex-wrap items-end gap-3">
                          {/* Account Select */}
                          <div className="min-w-[180px] flex-1">
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                              Conta
                            </label>
                            <Select
                              value={rule.accountId}
                              onChange={(e) =>
                                updateRule(index, {
                                  accountId: e.target.value,
                                })
                              }
                            >
                              <option value="">Selecione...</option>
                              {available.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name} •{" "}
                                  {getAccountTypeLabel(acc.type)}
                                </option>
                              ))}
                              {rule.accountId &&
                                !available.find(
                                  (a) => a.id === rule.accountId,
                                ) && (
                                  <option value={rule.accountId}>
                                    {selectedAccount?.name || "Conta removida"}
                                  </option>
                                )}
                            </Select>
                          </div>

                          {/* Origin Toggle */}
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                              Tipo
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                updateRule(index, {
                                  isOrigin: !rule.isOrigin,
                                })
                              }
                              className={`inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-all ${
                                rule.isOrigin
                                  ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40"
                                  : "bg-secondary text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {rule.isOrigin ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Origem
                                </>
                              ) : (
                                "Destino"
                              )}
                            </button>
                          </div>

                          {/* Percentage Input */}
                          {!rule.isOrigin && (
                            <div className="w-[110px]">
                              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                Porcentagem
                              </label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={rule.percentage || ""}
                                  onChange={(e) =>
                                    updateRule(index, {
                                      percentage:
                                        parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="0"
                                  className="pr-7 text-right"
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  %
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Calculated Value */}
                          <div className="min-w-[120px] text-right">
                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                              Valor
                            </label>
                            <div className="flex h-10 items-center justify-end">
                              {rule.isOrigin ? (
                                <Badge className="bg-blue-500/15 text-blue-400 hover:bg-blue-500/15">
                                  Recebe Salário
                                </Badge>
                              ) : (
                                <span
                                  className={`text-lg font-bold tabular-nums ${
                                    calculatedValue > 0
                                      ? "text-green-500"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {formatCurrency(calculatedValue)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                            onClick={() => removeRule(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Percentage Indicator */}
                  {nonOriginRules.length > 0 && (
                    <div
                      className={`rounded-lg border p-4 transition-colors ${
                        isValidPercentage
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-border"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium">
                          Total das porcentagens
                        </span>
                        <span
                          className={`font-bold tabular-nums ${
                            isValidPercentage
                              ? "text-green-500"
                              : totalPercentage > 100
                                ? "text-destructive"
                                : "text-yellow-500"
                          }`}
                        >
                          {totalPercentage.toFixed(1)}%{" "}
                          <span className="font-normal text-muted-foreground">
                            / 100%
                          </span>
                        </span>
                      </div>
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isValidPercentage
                              ? "bg-green-500"
                              : totalPercentage > 100
                                ? "bg-destructive"
                                : "bg-yellow-500"
                          }`}
                          style={{
                            width: `${Math.min(100, totalPercentage)}%`,
                          }}
                        />
                      </div>
                      {isValidPercentage ? (
                        <p className="mt-2 flex items-center gap-1 text-xs text-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                          Distribuição completa
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {totalPercentage < 100
                            ? `Faltam ${(100 - totalPercentage).toFixed(1)}% para completar.`
                            : `Excedendo em ${(totalPercentage - 100).toFixed(1)}%. Reduza as porcentagens.`}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Summary */}
        <div className="space-y-6">
          {/* Quick Summary Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {salary > 0 ? (
                <>
                  <div className="text-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Salário
                    </p>
                    <p className="mt-1 text-3xl font-bold">
                      {formatCurrency(salary)}
                    </p>
                  </div>

                  {originAccountData && (
                    <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm">
                      <ArrowRight className="h-4 w-4 shrink-0 text-blue-400" />
                      <span className="text-blue-400">
                        Recebido em{" "}
                        <span className="font-medium">
                          {originAccountData.name}
                        </span>
                      </span>
                    </div>
                  )}

                  {nonOriginRules.length > 0 && (
                    <div className="space-y-2 border-t border-border pt-4">
                      {nonOriginRules.map((rule, index) => {
                        const account = accounts.find(
                          (a) => a.id === rule.accountId,
                        );
                        if (!account) return null;
                        const value = (salary * rule.percentage) / 100;

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <span className="truncate">{account.name}</span>
                            </div>
                            <div className="flex items-center gap-2 tabular-nums">
                              <span className="text-muted-foreground">
                                {rule.percentage}%
                              </span>
                              <span className="font-medium text-green-500">
                                {formatCurrency(value)}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-medium">
                        <span>Total</span>
                        <span
                          className={
                            isValidPercentage
                              ? "text-green-500"
                              : "text-yellow-500"
                          }
                        >
                          {formatCurrency(
                            nonOriginRules.reduce(
                              (sum, r) => sum + (salary * r.percentage) / 100,
                              0,
                            ),
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isValid && rules.length > 0 && (
                    <div className="space-y-1 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {salary <= 0 && <p>• Informe o valor do salário</p>}
                      {hasEmptyAccounts && (
                        <p>• Selecione todas as contas</p>
                      )}
                      {hasDuplicateAccounts && (
                        <p>• Remova contas duplicadas</p>
                      )}
                      {originCount > 1 && (
                        <p>• Apenas uma conta de origem permitida</p>
                      )}
                      {!isValidPercentage && nonOriginRules.length > 0 && (
                        <p>• As porcentagens devem somar 100%</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <Banknote className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Informe o valor do salário para visualizar o resumo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribution Visualization */}
          {salary > 0 && isValidPercentage && nonOriginRules.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Distribuição Visual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nonOriginRules.map((rule, index) => {
                    const account = accounts.find(
                      (a) => a.id === rule.accountId,
                    );
                    if (!account) return null;

                    return (
                      <div key={index}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="truncate font-medium">
                            {account.name}
                          </span>
                          <span className="text-muted-foreground">
                            {rule.percentage}%
                          </span>
                        </div>
                        <div className="relative h-6 w-full overflow-hidden rounded bg-secondary">
                          <div
                            className="flex h-full items-center justify-end rounded bg-green-500/20 px-2 transition-all duration-300"
                            style={{ width: `${rule.percentage}%` }}
                          >
                            {rule.percentage >= 15 && (
                              <span className="text-xs font-medium text-green-500">
                                {formatCurrency(
                                  (salary * rule.percentage) / 100,
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
