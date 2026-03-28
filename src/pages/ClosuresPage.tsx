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
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatMonth, getCurrentMonth } from "@/lib/utils";
import type { MonthClosure, MonthSummary } from "@/types";
import { Calendar, Lock, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export function ClosuresPage() {
  const [closures, setClosures] = useState<MonthClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [currentStatus, setCurrentStatus] = useState<{
    isClosed: boolean;
    summary: MonthSummary;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    loadClosures();
  }, []);

  async function loadClosures() {
    try {
      const data = await window.api.closures.getAll();
      setClosures(data);
    } catch (error) {
      addToast({
        title: "Erro ao carregar fechamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function openCloseDialog() {
    setNotes("");
    try {
      const status = await window.api.closures.getStatus(selectedMonth);
      setCurrentStatus(status);
      setDialogOpen(true);
    } catch (error) {
      addToast({ title: "Erro ao verificar status", variant: "destructive" });
    }
  }

  async function handleClose() {
    try {
      await window.api.closures.create({ month: selectedMonth, notes });
      addToast({ title: "Mês fechado com sucesso!", variant: "success" });
      setDialogOpen(false);
      loadClosures();
    } catch (error) {
      addToast({ title: "Erro ao fechar mês", variant: "destructive" });
    }
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
          <h1 className="text-3xl font-bold">Fechamentos Mensais</h1>
          <p className="text-muted-foreground">
            Histórico de fechamentos de cada mês
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-48"
          />
          <Button onClick={openCloseDialog}>
            <Lock className="mr-2 h-4 w-4" />
            Fechar Mês
          </Button>
        </div>
      </div>

      {/* Closures Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {closures.map((closure) => (
          <Card key={closure.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                {formatMonth(closure.month)}
              </CardTitle>
              <Badge variant="success">
                <Lock className="mr-1 h-3 w-3" />
                Fechado
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Receitas
                  </div>
                  <span className="font-medium text-green-500">
                    {formatCurrency(closure.totalIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Despesas
                  </div>
                  <span className="font-medium text-red-500">
                    {formatCurrency(closure.totalExpense)}
                  </span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Balanço</span>
                    <span
                      className={`font-bold ${closure.balance >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {formatCurrency(closure.balance)}
                    </span>
                  </div>
                </div>
                {closure.notes && (
                  <p className="text-sm text-muted-foreground">
                    {closure.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {closures.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="mx-auto mb-4 h-12 w-12" />
            <p>Nenhum mês fechado ainda</p>
            <p className="text-sm">
              Feche um mês para criar um registro histórico
            </p>
          </CardContent>
        </Card>
      )}

      {/* Close Month Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogClose onClose={() => setDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>Fechar Mês - {formatMonth(selectedMonth)}</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          {currentStatus?.isClosed ? (
            <div className="rounded-lg bg-yellow-500/10 p-4 text-yellow-500">
              Este mês já foi fechado anteriormente.
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-secondary p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Receitas:</span>
                  <span className="font-medium text-green-500">
                    {formatCurrency(currentStatus?.summary.income || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Despesas:</span>
                  <span className="font-medium text-red-500">
                    {formatCurrency(currentStatus?.summary.expense || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="font-medium">Balanço:</span>
                  <span
                    className={`font-bold ${(currentStatus?.summary.balance || 0) >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {formatCurrency(currentStatus?.summary.balance || 0)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Observações (opcional)
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas sobre o fechamento..."
                />
              </div>
            </>
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
          {!currentStatus?.isClosed && (
            <Button onClick={handleClose}>
              <Lock className="mr-2 h-4 w-4" />
              Confirmar Fechamento
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}
