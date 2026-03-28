import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  formatCurrency,
  formatDate,
  formatMonth,
  getCurrentMonth,
} from "@/lib/utils";
import type {
  Account,
  Category,
  CreateTransactionDto,
  Tag,
  Transaction,
  TransactionFilters,
  TransactionType,
} from "@/types";
import {
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [filters, setFilters] = useState<TransactionFilters>({
    month: getCurrentMonth(),
  });
  const [formData, setFormData] = useState<CreateTransactionDto>({
    description: "",
    amount: 0,
    type: "EXPENSE",
    date: new Date().toISOString().split("T")[0],
    accountId: "",
    categoryId: "",
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  async function loadData() {
    try {
      const [accs, cats, tgs] = await Promise.all([
        window.api.accounts.getAll(),
        window.api.categories.getAll(),
        window.api.tags.getAll(),
      ]);
      setAccounts(accs);
      setCategories(cats);
      setTags(tgs);
    } catch (error) {
      addToast({ title: "Erro ao carregar dados", variant: "destructive" });
    }
  }

  async function loadTransactions() {
    try {
      setLoading(true);
      const data = await window.api.transactions.getAll(filters);
      setTransactions(data);
    } catch (error) {
      addToast({
        title: "Erro ao carregar transações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingTransaction(null);
    setSelectedTagIds([]);
    setFormData({
      description: "",
      amount: 0,
      type: "EXPENSE",
      date: new Date().toISOString().split("T")[0],
      accountId: accounts[0]?.id || "",
      categoryId: "",
    });
    setDialogOpen(true);
  }

  function openEditDialog(transaction: Transaction) {
    setEditingTransaction(transaction);
    setSelectedTagIds(
      transaction.tags?.map((tt) => tt.tagId) || []
    );
    setFormData({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      date: new Date(transaction.date).toISOString().split("T")[0],
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      notes: transaction.notes || undefined,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingTransaction) {
        await window.api.transactions.update(editingTransaction.id, formData);
        await window.api.tags.setTransactionTags(
          editingTransaction.id,
          selectedTagIds,
        );
        addToast({ title: "Transação atualizada!", variant: "success" });
      } else {
        const created = await window.api.transactions.create(formData);
        if (selectedTagIds.length > 0 && created?.id) {
          await window.api.tags.setTransactionTags(
            created.id,
            selectedTagIds,
          );
        }
        addToast({ title: "Transação criada!", variant: "success" });
      }
      setDialogOpen(false);
      loadTransactions();
    } catch (error) {
      addToast({ title: "Erro ao salvar transação", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir esta transação?")) return;
    try {
      await window.api.transactions.delete(id);
      addToast({ title: "Transação excluída!", variant: "success" });
      loadTransactions();
    } catch (error) {
      addToast({ title: "Erro ao excluir transação", variant: "destructive" });
    }
  }

  const filteredCategories = categories.filter((c) => c.type === formData.type);
  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <Input
            type="month"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            className="w-48"
          />
          <Select
            value={filters.type || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                type: (e.target.value as TransactionType) || undefined,
              })
            }
            className="w-40"
          >
            <option value="">Todos</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
          </Select>
          <Select
            value={filters.accountId || ""}
            onChange={(e) =>
              setFilters({ ...filters, accountId: e.target.value || undefined })
            }
            className="w-48"
          >
            <option value="">Todas as contas</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(income)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(expense)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Balanço</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${income - expense >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {formatCurrency(income - expense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Transações - {formatMonth(filters.month || getCurrentMonth())}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.type === "INCOME" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        {transaction.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {transaction.category?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {transaction.tags?.map((tt) => (
                          <span
                            key={tt.id}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${tt.tag?.color || "#6b7280"}20`,
                              color: tt.tag?.color || "#6b7280",
                              border: `1px solid ${tt.tag?.color || "#6b7280"}30`,
                            }}
                          >
                            {tt.tag?.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.account?.name}</TableCell>
                    <TableCell
                      className={`text-right font-bold ${transaction.type === "INCOME" ? "text-green-500" : "text-red-500"}`}
                    >
                      {transaction.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(transaction)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogClose onClose={() => setDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as TransactionType,
                    categoryId: "",
                  })
                }
              >
                <option value="INCOME">Receita</option>
                <option value="EXPENSE">Despesa</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Valor</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Conta</label>
              <Select
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                required
              >
                <option value="">Selecione...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                required
              >
                <option value="">Selecione...</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Input
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Observações"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tags (opcional)</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTagIds(
                          isSelected
                            ? selectedTagIds.filter((id) => id !== tag.id)
                            : [...selectedTagIds, tag.id],
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all"
                      style={{
                        backgroundColor: isSelected
                          ? `${tag.color}25`
                          : "transparent",
                        color: isSelected ? tag.color : "#888",
                        border: `1.5px solid ${isSelected ? tag.color : "#333"}`,
                      }}
                    >
                      {tag.name}
                      {isSelected && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
                {tags.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Nenhuma tag cadastrada
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nova tag..."
                  className="h-7 text-xs"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!newTagName.trim()) return;
                      try {
                        const colors = [
                          "#ef4444",
                          "#f97316",
                          "#eab308",
                          "#22c55e",
                          "#3b82f6",
                          "#8b5cf6",
                          "#ec4899",
                          "#06b6d4",
                        ];
                        const color =
                          colors[Math.floor(Math.random() * colors.length)];
                        const tag = await window.api.tags.create({
                          name: newTagName.trim(),
                          color,
                        });
                        setTags([...tags, tag]);
                        setSelectedTagIds([...selectedTagIds, tag.id]);
                        setNewTagName("");
                      } catch {
                        addToast({
                          title: "Erro ao criar tag",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Enter p/ criar
                </span>
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
