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
import { formatCurrency, getAccountTypeLabel } from "@/lib/utils";
import type { Account, AccountType, CreateAccountDto } from "@/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";

const accountTypes: AccountType[] = [
  "CHECKING",
  "SAVINGS",
  "CREDIT_CARD",
  "CASH",
  "INVESTMENT",
];

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<CreateAccountDto>({
    name: "",
    type: "CHECKING",
    initialBalance: 0,
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const data = await window.api.accounts.getAll();
      setAccounts(data);
    } catch (error) {
      addToast({ title: "Erro ao carregar contas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingAccount(null);
    setFormData({ name: "", type: "CHECKING", initialBalance: 0 });
    setDialogOpen(true);
  }

  function openEditDialog(account: Account) {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      initialBalance: account.balance,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingAccount) {
        await window.api.accounts.update(editingAccount.id, {
          name: formData.name,
          type: formData.type,
        });
        addToast({ title: "Conta atualizada!", variant: "success" });
      } else {
        await window.api.accounts.create(formData);
        addToast({ title: "Conta criada!", variant: "success" });
      }
      setDialogOpen(false);
      loadAccounts();
    } catch (error) {
      addToast({ title: "Erro ao salvar conta", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir esta conta?")) return;
    try {
      await window.api.accounts.delete(id);
      addToast({ title: "Conta excluída!", variant: "success" });
      loadAccounts();
    } catch (error) {
      addToast({ title: "Erro ao excluir conta", variant: "destructive" });
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas bancárias
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saldo Total: {formatCurrency(totalBalance)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getAccountTypeLabel(account.type)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-bold ${account.balance >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {formatCurrency(account.balance)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(account)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogClose onClose={() => setDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>
            {editingAccount ? "Editar Conta" : "Nova Conta"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome da conta"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as AccountType,
                  })
                }
              >
                {accountTypes.map((type) => (
                  <option key={type} value={type}>
                    {getAccountTypeLabel(type)}
                  </option>
                ))}
              </Select>
            </div>
            {!editingAccount && (
              <div>
                <label className="text-sm font-medium">Saldo Inicial</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.initialBalance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialBalance: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            )}
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
