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
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  Account,
  Bill,
  BillType,
  Category,
  CreateBillDto,
} from "@/types";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Filter,
  Pencil,
  Plus,
  Trash2,
  Undo2,
} from "lucide-react";
import React, { useEffect, useState } from "react";

type FilterStatus = "ALL" | "PENDING" | "PAID" | "OVERDUE";

export function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [filterType, setFilterType] = useState<BillType | "">("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [formData, setFormData] = useState<CreateBillDto>({
    description: "",
    amount: 0,
    type: "PAYABLE",
    dueDate: new Date().toISOString().split("T")[0],
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [billsData, accs, cats] = await Promise.all([
        window.api.bills.getAll(),
        window.api.accounts.getAll(),
        window.api.categories.getAll(),
      ]);
      setBills(billsData);
      setAccounts(accs);
      setCategories(cats);
    } catch (error) {
      addToast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingBill(null);
    setFormData({
      description: "",
      amount: 0,
      type: "PAYABLE",
      dueDate: new Date().toISOString().split("T")[0],
    });
    setDialogOpen(true);
  }

  function openEditDialog(bill: Bill) {
    setEditingBill(bill);
    setFormData({
      description: bill.description,
      amount: bill.amount,
      type: bill.type,
      dueDate: new Date(bill.dueDate).toISOString().split("T")[0],
      isRecurring: bill.isRecurring,
      notes: bill.notes || undefined,
      categoryId: bill.categoryId || undefined,
      accountId: bill.accountId || undefined,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingBill) {
        await window.api.bills.update(editingBill.id, formData);
        addToast({ title: "Conta atualizada!", variant: "success" });
      } else {
        await window.api.bills.create(formData);
        addToast({ title: "Conta criada!", variant: "success" });
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      addToast({ title: "Erro ao salvar conta", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir esta conta?")) return;
    try {
      await window.api.bills.delete(id);
      addToast({ title: "Conta excluída!", variant: "success" });
      loadData();
    } catch (error) {
      addToast({ title: "Erro ao excluir conta", variant: "destructive" });
    }
  }

  async function togglePaid(bill: Bill) {
    try {
      if (bill.isPaid) {
        await window.api.bills.markAsUnpaid(bill.id);
        addToast({ title: "Conta marcada como pendente", variant: "success" });
      } else {
        await window.api.bills.markAsPaid(bill.id);
        addToast({ title: "Conta marcada como paga!", variant: "success" });
      }
      loadData();
    } catch (error) {
      addToast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  }

  function isOverdue(bill: Bill): boolean {
    if (bill.isPaid) return false;
    return new Date(bill.dueDate) < new Date(new Date().toDateString());
  }

  const filteredBills = bills.filter((bill) => {
    if (filterType && bill.type !== filterType) return false;
    if (filterStatus === "PAID" && !bill.isPaid) return false;
    if (filterStatus === "PENDING" && bill.isPaid) return false;
    if (filterStatus === "OVERDUE" && !isOverdue(bill)) return false;
    return true;
  });

  const totalPayable = bills
    .filter((b) => b.type === "PAYABLE" && !b.isPaid)
    .reduce((s, b) => s + b.amount, 0);
  const totalReceivable = bills
    .filter((b) => b.type === "RECEIVABLE" && !b.isPaid)
    .reduce((s, b) => s + b.amount, 0);
  const totalOverdue = bills.filter((b) => isOverdue(b)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar / Receber</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas pendentes e recebimentos
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(totalPayable)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(totalReceivable)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-orange-500">
                {totalOverdue}
              </span>
              {totalOverdue > 0 && (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as BillType | "")}
            className="w-44"
          >
            <option value="">Todos os tipos</option>
            <option value="PAYABLE">A Pagar</option>
            <option value="RECEIVABLE">A Receber</option>
          </Select>
          <Select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as FilterStatus)
            }
            className="w-40"
          >
            <option value="ALL">Todos</option>
            <option value="PENDING">Pendentes</option>
            <option value="PAID">Pagas</option>
            <option value="OVERDUE">Vencidas</option>
          </Select>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma conta encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow
                    key={bill.id}
                    className={isOverdue(bill) ? "bg-orange-500/5" : undefined}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {bill.type === "RECEIVABLE" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {bill.type === "PAYABLE" ? "Pagar" : "Receber"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{bill.description}</span>
                        {bill.isRecurring && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Recorrente
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          isOverdue(bill) ? "text-orange-500 font-medium" : ""
                        }
                      >
                        {formatDate(bill.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {bill.isPaid ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          Paga
                        </Badge>
                      ) : isOverdue(bill) ? (
                        <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                          Vencida
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${bill.type === "RECEIVABLE" ? "text-green-500" : "text-red-500"}`}
                    >
                      {formatCurrency(bill.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePaid(bill)}
                          title={bill.isPaid ? "Marcar como pendente" : "Marcar como paga"}
                        >
                          {bill.isPaid ? (
                            <Undo2 className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(bill)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(bill.id)}
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
            {editingBill ? "Editar Conta" : "Nova Conta"}
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
                    type: e.target.value as BillType,
                  })
                }
              >
                <option value="PAYABLE">A Pagar</option>
                <option value="RECEIVABLE">A Receber</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição da conta"
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
              <label className="text-sm font-medium">Data de Vencimento</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Conta (opcional)</label>
              <Select
                value={formData.accountId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accountId: e.target.value || undefined,
                  })
                }
              >
                <option value="">Nenhuma</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">
                Categoria (opcional)
              </label>
              <Select
                value={formData.categoryId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    categoryId: e.target.value || undefined,
                  })
                }
              >
                <option value="">Nenhuma</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring || false}
                onChange={(e) =>
                  setFormData({ ...formData, isRecurring: e.target.checked })
                }
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="isRecurring" className="text-sm font-medium">
                Recorrente
              </label>
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
