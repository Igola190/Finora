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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CreateFinancialGoalDto, FinancialGoal } from "@/types";
import { Pencil, Plus, Target, Trash2, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";

export function GoalsPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [formData, setFormData] = useState<CreateFinancialGoalDto>({
    name: "",
    targetAmount: 0,
    deadline: "",
    currentAmount: 0,
  });
  const [progressAmount, setProgressAmount] = useState(0);
  const { addToast } = useToast();

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      const data = await window.api.goals.getAll();
      setGoals(data);
    } catch (error) {
      addToast({ title: "Erro ao carregar metas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingGoal(null);
    setFormData({
      name: "",
      targetAmount: 0,
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      currentAmount: 0,
    });
    setDialogOpen(true);
  }

  function openEditDialog(goal: FinancialGoal) {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      deadline: new Date(goal.deadline).toISOString().split("T")[0],
      currentAmount: goal.currentAmount,
    });
    setDialogOpen(true);
  }

  function openProgressDialog(goal: FinancialGoal) {
    setSelectedGoal(goal);
    setProgressAmount(0);
    setProgressDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingGoal) {
        await window.api.goals.update(editingGoal.id, formData);
        addToast({ title: "Meta atualizada!", variant: "success" });
      } else {
        await window.api.goals.create(formData);
        addToast({ title: "Meta criada!", variant: "success" });
      }
      setDialogOpen(false);
      loadGoals();
    } catch (error) {
      addToast({ title: "Erro ao salvar meta", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir esta meta?")) return;
    try {
      await window.api.goals.delete(id);
      addToast({ title: "Meta excluída!", variant: "success" });
      loadGoals();
    } catch (error) {
      addToast({ title: "Erro ao excluir meta", variant: "destructive" });
    }
  }

  async function handleAddProgress(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      await window.api.goals.addProgress(selectedGoal.id, progressAmount);
      addToast({ title: "Progresso adicionado!", variant: "success" });
      setProgressDialogOpen(false);
      loadGoals();
    } catch (error) {
      addToast({
        title: "Erro ao adicionar progresso",
        variant: "destructive",
      });
    }
  }

  function getGoalStatus(goal: FinancialGoal) {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const isOverdue = deadline < now && progress < 100;

    if (progress >= 100)
      return { label: "Concluída", variant: "success" as const };
    if (isOverdue)
      return { label: "Atrasada", variant: "destructive" as const };
    return { label: "Em andamento", variant: "secondary" as const };
  }

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
          <h1 className="text-3xl font-bold">Metas Financeiras</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso das suas metas
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const status = getGoalStatus(goal);
          const remaining = goal.targetAmount - goal.currentAmount;

          return (
            <Card key={goal.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {goal.name}
                </CardTitle>
                <Badge variant={status.variant}>{status.label}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={Math.min(progress, 100)} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Atual</p>
                    <p className="font-bold text-green-500">
                      {formatCurrency(goal.currentAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Meta</p>
                    <p className="font-bold">
                      {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Faltam</span>
                  <span
                    className={`font-medium ${remaining <= 0 ? "text-green-500" : "text-muted-foreground"}`}
                  >
                    {remaining <= 0
                      ? "Meta atingida! 🎉"
                      : formatCurrency(remaining)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prazo</span>
                  <span>{formatDate(goal.deadline)}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openProgressDialog(goal)}
                  >
                    <TrendingUp className="mr-1 h-4 w-4" />
                    Adicionar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(goal)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="mx-auto mb-4 h-12 w-12" />
            <p>Nenhuma meta cadastrada</p>
            <p className="text-sm">
              Crie uma meta para começar a acompanhar seu progresso
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogClose onClose={() => setDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>{editingGoal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
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
                placeholder="Ex: Reserva de Emergência, Viagem..."
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Valor da Meta</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetAmount: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Valor Atual</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.currentAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Prazo</label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                required
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

      {/* Add Progress Dialog */}
      <Dialog
        open={progressDialogOpen}
        onClose={() => setProgressDialogOpen(false)}
      >
        <DialogClose onClose={() => setProgressDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>Adicionar Progresso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddProgress}>
          <DialogContent className="space-y-4">
            {selectedGoal && (
              <div className="rounded-lg bg-secondary p-4">
                <p className="font-medium">{selectedGoal.name}</p>
                <p className="text-sm text-muted-foreground">
                  Atual: {formatCurrency(selectedGoal.currentAmount)} /{" "}
                  {formatCurrency(selectedGoal.targetAmount)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Valor a Adicionar</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={progressAmount}
                onChange={(e) =>
                  setProgressAmount(parseFloat(e.target.value) || 0)
                }
                required
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setProgressDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Adicionar</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
