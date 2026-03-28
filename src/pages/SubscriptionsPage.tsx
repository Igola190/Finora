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
import { formatCurrency } from "@/lib/utils";
import type { BillingCycle, CreateSubscriptionDto, Subscription, SubscriptionMember } from "@/types";
import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editMemberDialogOpen, setEditMemberDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<{ subscriptionId: string; member: SubscriptionMember } | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedMember, setSelectedMember] = useState<SubscriptionMember | null>(null);
  const [formData, setFormData] = useState<CreateSubscriptionDto>({
    name: "",
    totalAmount: 0,
    billingDay: 1,
    billingCycle: "MONTHLY",
    isShared: false,
  });
  const [memberForm, setMemberForm] = useState({ name: "", share: 0, isOwner: false });
  const [paymentForm, setPaymentForm] = useState({ amount: 0, month: getCurrentMonth() });
  const { addToast } = useToast();

  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function getMonthlyEquivalent(subscription: Subscription) {
    if (subscription.billingCycle === "ANNUAL") {
      return subscription.totalAmount / 12;
    }
    return subscription.totalAmount;
  }

  function getBillingLabel(cycle: BillingCycle) {
    return cycle === "ANNUAL" ? "Anual" : "Mensal";
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      const data = await window.api.subscriptions.getAll();
      setSubscriptions(data);
    } catch (error) {
      addToast({
        title: "Erro ao carregar assinaturas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingSubscription(null);
    setFormData({ name: "", totalAmount: 0, billingDay: 1, billingCycle: "MONTHLY", isShared: false });
    setDialogOpen(true);
  }

  function openEditDialog(subscription: Subscription) {
    setEditingSubscription(subscription);
    setFormData({
      name: subscription.name,
      totalAmount: subscription.totalAmount,
      billingDay: subscription.billingDay,
      billingCycle: subscription.billingCycle || "MONTHLY",
      isShared: subscription.isShared,
    });
    setDialogOpen(true);
  }

  function openMemberDialog(subscription: Subscription) {
    setSelectedSubscription(subscription);
    setMemberForm({ name: "", share: 0, isOwner: false });
    setMemberDialogOpen(true);
  }

  function openEditMemberDialog(subscription: Subscription, member: SubscriptionMember) {
    setSelectedSubscription(subscription);
    setSelectedMember(member);
    setMemberForm({ name: member.name, share: member.share, isOwner: member.isOwner });
    setEditMemberDialogOpen(true);
  }

  function openPaymentDialog(subscription: Subscription, member: SubscriptionMember) {
    setSelectedSubscription(subscription);
    setSelectedMember(member);
    const amountDue = (subscription.totalAmount * member.share) / 100;
    setPaymentForm({ amount: amountDue, month: getCurrentMonth() });
    setPaymentDialogOpen(true);
  }

  function openDetailsDialog(subscription: Subscription) {
    setSelectedSubscription(subscription);
    setDetailsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingSubscription) {
        await window.api.subscriptions.update(editingSubscription.id, formData);
        addToast({ title: "Assinatura atualizada!", variant: "success" });
      } else {
        await window.api.subscriptions.create(formData);
        addToast({ title: "Assinatura criada!", variant: "success" });
      }
      setDialogOpen(false);
      loadSubscriptions();
    } catch (error) {
      addToast({ title: "Erro ao salvar assinatura", variant: "destructive" });
    }
  }

  function openDeleteDialog(subscription: Subscription) {
    setSubscriptionToDelete(subscription);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!subscriptionToDelete) return;
    try {
      await window.api.subscriptions.delete(subscriptionToDelete.id);
      addToast({ title: "Assinatura excluída!", variant: "success" });
      setDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
      loadSubscriptions();
    } catch (error) {
      addToast({ title: "Erro ao excluir assinatura", variant: "destructive" });
    }
  }

  function openDeleteMemberDialog(subscriptionId: string, member: SubscriptionMember) {
    setMemberToDelete({ subscriptionId, member });
    setDeleteMemberDialogOpen(true);
  }

  async function handleConfirmDeleteMember() {
    if (!memberToDelete) return;
    try {
      await window.api.subscriptions.removeMember(memberToDelete.subscriptionId, memberToDelete.member.id);
      addToast({ title: "Membro removido!", variant: "success" });
      setDeleteMemberDialogOpen(false);
      setMemberToDelete(null);
      loadSubscriptions();
    } catch (error) {
      addToast({ title: "Erro ao remover membro", variant: "destructive" });
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSubscription) return;
    
    // Validate share percentage
    const currentTotal = selectedSubscription.members?.reduce((sum, m) => sum + m.share, 0) ?? 0;
    if (currentTotal + memberForm.share > 100) {
      addToast({ 
        title: "Erro: A soma das participações não pode ultrapassar 100%", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      await window.api.subscriptions.addMember(selectedSubscription.id, memberForm);
      addToast({ title: "Membro adicionado!", variant: "success" });
      setMemberDialogOpen(false);
      loadSubscriptions();
    } catch (error) {
      addToast({ title: "Erro ao adicionar membro", variant: "destructive" });
    }
  }

  async function handleEditMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSubscription || !selectedMember) return;
    
    // Validate share percentage
    const otherMembersTotal = selectedSubscription.members
      ?.filter(m => m.id !== selectedMember.id)
      .reduce((sum, m) => sum + m.share, 0) ?? 0;
    if (otherMembersTotal + memberForm.share > 100) {
      addToast({ 
        title: "Erro: A soma das participações não pode ultrapassar 100%", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      await window.api.subscriptions.updateMember(selectedMember.id, memberForm);
      addToast({ title: "Membro atualizado!", variant: "success" });
      setEditMemberDialogOpen(false);
      loadSubscriptions();
    } catch (error) {
      addToast({ title: "Erro ao atualizar membro", variant: "destructive" });
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      await window.api.subscriptions.recordMemberPayment(selectedMember.id, paymentForm);
      addToast({ title: "Pagamento registrado!", variant: "success" });
      setPaymentDialogOpen(false);
      loadSubscriptions();
    } catch (error) {
      addToast({ title: "Erro ao registrar pagamento", variant: "destructive" });
    }
  }

  function getMemberPaymentStatus(member: SubscriptionMember, subscription: Subscription, month: string) {
    const amountDue = (subscription.totalAmount * member.share) / 100;
    const paidThisMonth = member.payments
      ?.filter(p => p.month === month)
      .reduce((sum, p) => sum + p.amount, 0) ?? 0;
    return {
      amountDue,
      paidThisMonth,
      isPaid: paidThisMonth >= amountDue,
      pendingAmount: Math.max(0, amountDue - paidThisMonth)
    };
  }

  function getShareValidation(subscription: Subscription) {
    const total = subscription.members?.reduce((sum, m) => sum + m.share, 0) ?? 0;
    return {
      total,
      isValid: total === 100,
      remaining: 100 - total
    };
  }

  const totalMonthly = subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + getMonthlyEquivalent(s), 0);

  const totalAnnualOnly = subscriptions
    .filter(s => s.isActive && s.billingCycle === "ANNUAL")
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const sharedSubscriptions = subscriptions.filter(s => s.isShared && s.isActive);
  const currentMonth = getCurrentMonth();

  // Calculate my share (sum of all "owner" portions)
  const myMonthlyShare = sharedSubscriptions.reduce((sum, sub) => {
    const ownerMember = sub.members?.find(m => m.isOwner);
    if (ownerMember) {
      return sum + (getMonthlyEquivalent(sub) * ownerMember.share) / 100;
    }
    return sum + getMonthlyEquivalent(sub); // If no owner defined, assume full amount
  }, 0);

  // Calculate amount to receive from others
  const amountToReceive = sharedSubscriptions.reduce((sum, sub) => {
    const nonOwnerMembers = sub.members?.filter(m => !m.isOwner) ?? [];
    return sum + nonOwnerMembers.reduce((mSum, m) => {
      const status = getMemberPaymentStatus(m, sub, currentMonth);
      return mSum + status.pendingAmount;
    }, 0);
  }, 0);

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
          <h1 className="text-3xl font-bold">Assinaturas</h1>
          <p className="text-muted-foreground">
            Gerencie suas assinaturas e serviços recorrentes
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Assinatura
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Custo Mensal Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(totalMonthly)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Equivalente mensal de todas as assinaturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Compromisso Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {formatCurrency(totalAnnualOnly)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total em assinaturas anuais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Minha Parte (Compartilhadas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(myMonthlyShare)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor mensal nas compartilhadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              A Receber dos Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${amountToReceive > 0 ? 'text-amber-500' : 'text-green-500'}`}>
              {formatCurrency(amountToReceive)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {amountToReceive > 0 
                ? 'Pagamentos pendentes este mês' 
                : 'Todos os pagamentos em dia!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {[...subscriptions].sort((a, b) => Number(a.isShared) - Number(b.isShared)).map((subscription) => {
          const shareValidation = getShareValidation(subscription);
          const isAnnual = subscription.billingCycle === "ANNUAL";
          
          return (
            <Card
              key={subscription.id}
              className={`break-inside-avoid ${!subscription.isActive ? "opacity-50" : ""}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {subscription.name}
                </CardTitle>
                <div className="flex gap-1 flex-wrap justify-end">
                  {isAnnual && (
                    <Badge variant="secondary" className="bg-blue-500/15 text-blue-400 border-blue-500/30">
                      <CalendarClock className="mr-1 h-3 w-3" />
                      Anual
                    </Badge>
                  )}
                  {subscription.isShared && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => openDetailsDialog(subscription)}>
                      <Users className="mr-1 h-3 w-3" />
                      Compartilhada
                    </Badge>
                  )}
                  {!subscription.isActive && (
                    <Badge variant="outline">Inativa</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Valor {getBillingLabel(subscription.billingCycle || "MONTHLY").toLowerCase()}
                  </span>
                  <span className="text-xl font-bold">
                    {formatCurrency(subscription.totalAmount)}
                  </span>
                </div>
                {isAnnual && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Repeat className="h-3 w-3" />
                      Equivalente mensal
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(getMonthlyEquivalent(subscription))}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Dia de cobrança</span>
                  <span>Dia {subscription.billingDay}</span>
                </div>

                {/* Shared Subscription Members Section */}
                {subscription.isShared && (
                  <div className="space-y-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Membros</span>
                      <div className="flex items-center gap-2">
                        {!shareValidation.isValid && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            {shareValidation.remaining > 0 
                              ? `Falta ${shareValidation.remaining}%`
                              : `Excede ${Math.abs(shareValidation.remaining)}%`}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openMemberDialog(subscription)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {subscription.members && subscription.members.length > 0 ? (
                      <div className="space-y-2">
                        {subscription.members.map((member) => {
                          const status = getMemberPaymentStatus(member, subscription, currentMonth);
                          return (
                            <div
                              key={member.id}
                              className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`p-1 rounded-full ${member.isOwner ? 'bg-primary/20' : 'bg-muted'}`}>
                                  <User className={`h-3 w-3 ${member.isOwner ? 'text-primary' : ''}`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{member.name}</span>
                                    {member.isOwner && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                                        Você
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {member.share}% = {formatCurrency(status.amountDue)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!member.isOwner && (
                                  <>
                                    {status.isPaid ? (
                                      <Badge variant="default" className="bg-green-500 text-xs">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Pago
                                      </Badge>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => openPaymentDialog(subscription, member)}
                                      >
                                        <DollarSign className="mr-1 h-3 w-3" />
                                        Receber
                                      </Button>
                                    )}
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => openEditMemberDialog(subscription, member)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => openDeleteMemberDialog(subscription.id, member)}
                                >
                                  <UserMinus className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Payment Progress */}
                        {subscription.members.filter(m => !m.isOwner).length > 0 && (
                          <div className="pt-2">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Recebimentos do mês</span>
                              <span>
                                {formatCurrency(
                                  subscription.members
                                    .filter(m => !m.isOwner)
                                    .reduce((sum, m) => sum + getMemberPaymentStatus(m, subscription, currentMonth).paidThisMonth, 0)
                                )} / {formatCurrency(
                                  subscription.members
                                    .filter(m => !m.isOwner)
                                    .reduce((sum, m) => sum + getMemberPaymentStatus(m, subscription, currentMonth).amountDue, 0)
                                )}
                              </span>
                            </div>
                            <Progress 
                              value={
                                (() => {
                                  const total = subscription.members
                                    .filter(m => !m.isOwner)
                                    .reduce((sum, m) => sum + getMemberPaymentStatus(m, subscription, currentMonth).amountDue, 0);
                                  const paid = subscription.members
                                    .filter(m => !m.isOwner)
                                    .reduce((sum, m) => sum + getMemberPaymentStatus(m, subscription, currentMonth).paidThisMonth, 0);
                                  return total > 0 ? (paid / total) * 100 : 0;
                                })()
                              }
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-sm text-muted-foreground">
                        <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>Nenhum membro adicionado</p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => openMemberDialog(subscription)}
                        >
                          Adicionar primeiro membro
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(subscription)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(subscription)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {subscriptions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="mx-auto mb-4 h-12 w-12" />
            <p>Nenhuma assinatura cadastrada</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Subscription Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogClose onClose={() => setDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>
            {editingSubscription ? "Editar Assinatura" : "Nova Assinatura"}
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
                placeholder="Ex: Netflix, Spotify..."
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ciclo de Cobrança</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    formData.billingCycle === "MONTHLY"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                  onClick={() => setFormData({ ...formData, billingCycle: "MONTHLY" })}
                >
                  <Repeat className="h-4 w-4" />
                  Mensal
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    formData.billingCycle === "ANNUAL"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-border text-muted-foreground hover:border-blue-500/50"
                  }`}
                  onClick={() => setFormData({ ...formData, billingCycle: "ANNUAL" })}
                >
                  <CalendarClock className="h-4 w-4" />
                  Anual
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                Valor {formData.billingCycle === "ANNUAL" ? "Anual" : "Mensal"}
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.totalAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalAmount: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
              {formData.billingCycle === "ANNUAL" && formData.totalAmount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Equivalente mensal: {formatCurrency(formData.totalAmount / 12)}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Dia de Cobrança</label>
              <Input
                type="number"
                min="1"
                max="31"
                value={formData.billingDay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingDay: parseInt(e.target.value) || 1,
                  })
                }
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isShared"
                checked={formData.isShared}
                onChange={(e) =>
                  setFormData({ ...formData, isShared: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label htmlFor="isShared" className="text-sm font-medium">
                Assinatura compartilhada
              </label>
            </div>
            {formData.isShared && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                <p>💡 Após criar a assinatura, você poderá adicionar membros e definir a participação de cada um.</p>
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

      {/* Add Member Dialog */}
      <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)}>
        <DialogClose onClose={() => setMemberDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddMember}>
          <DialogContent className="space-y-4">
            {selectedSubscription && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium">{selectedSubscription.name}</p>
                <p className="text-muted-foreground">
                  Valor total: {formatCurrency(selectedSubscription.totalAmount)}
                </p>
                {selectedSubscription.members && selectedSubscription.members.length > 0 && (
                  <p className="text-muted-foreground">
                    Participação já alocada: {selectedSubscription.members.reduce((sum, m) => sum + m.share, 0)}%
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={memberForm.name}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, name: e.target.value })
                }
                placeholder="Nome do membro"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Participação (%)</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={memberForm.share}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    share: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
              {selectedSubscription && memberForm.share > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Valor: {formatCurrency((selectedSubscription.totalAmount * memberForm.share) / 100)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isOwner"
                checked={memberForm.isOwner}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, isOwner: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label htmlFor="isOwner" className="text-sm font-medium">
                Este sou eu (responsável pelo pagamento)
              </label>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMemberDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Adicionar</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editMemberDialogOpen} onClose={() => setEditMemberDialogOpen(false)}>
        <DialogClose onClose={() => setEditMemberDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>Editar Membro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEditMember}>
          <DialogContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={memberForm.name}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, name: e.target.value })
                }
                placeholder="Nome do membro"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Participação (%)</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={memberForm.share}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    share: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
              {selectedSubscription && memberForm.share > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Valor: {formatCurrency((selectedSubscription.totalAmount * memberForm.share) / 100)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isOwnerEdit"
                checked={memberForm.isOwner}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, isOwner: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label htmlFor="isOwnerEdit" className="text-sm font-medium">
                Este sou eu (responsável pelo pagamento)
              </label>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditMemberDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
        <DialogClose onClose={() => setPaymentDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleRecordPayment}>
          <DialogContent className="space-y-4">
            {selectedMember && selectedSubscription && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium">{selectedMember.name}</p>
                <p className="text-muted-foreground">
                  Assinatura: {selectedSubscription.name}
                </p>
                <p className="text-muted-foreground">
                  Valor devido: {formatCurrency((selectedSubscription.totalAmount * selectedMember.share) / 100)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Valor Recebido</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mês de Referência</label>
              <Input
                type="month"
                value={paymentForm.month}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, month: e.target.value })
                }
                required
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Check className="mr-2 h-4 w-4" />
              Registrar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Subscription Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)}>
        <DialogClose onClose={() => setDetailsDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>
            {selectedSubscription?.name} - Detalhes
          </DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          {selectedSubscription && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedSubscription.totalAmount)}</p>
                  {selectedSubscription.billingCycle === "ANNUAL" && (
                    <p className="text-xs text-muted-foreground">/ano ({formatCurrency(selectedSubscription.totalAmount / 12)}/mês)</p>
                  )}
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Cobrança</p>
                  <p className="text-xl font-bold">Dia {selectedSubscription.billingDay}</p>
                  <p className="text-xs text-muted-foreground">{getBillingLabel(selectedSubscription.billingCycle || "MONTHLY")}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Divisão entre Membros</h4>
                {selectedSubscription.members?.map(member => {
                  const status = getMemberPaymentStatus(member, selectedSubscription, currentMonth);
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className={`h-4 w-4 ${member.isOwner ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <span className="font-medium">{member.name}</span>
                          {member.isOwner && <Badge variant="outline" className="ml-2 text-xs">Você</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(status.amountDue)}</p>
                        <p className="text-xs text-muted-foreground">{member.share}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Status do Mês Atual ({currentMonth})</h4>
                {selectedSubscription.members?.filter(m => !m.isOwner).map(member => {
                  const status = getMemberPaymentStatus(member, selectedSubscription, currentMonth);
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span>{member.name}</span>
                      <div className="flex items-center gap-2">
                        {status.isPaid ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Pendente: {formatCurrency(status.pendingAmount)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {selectedSubscription.members?.filter(m => !m.isOwner).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Adicione outros membros para acompanhar os pagamentos
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
        <DialogFooter>
          <Button onClick={() => setDetailsDialogOpen(false)}>Fechar</Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Subscription Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogClose onClose={() => setDeleteDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>Excluir Assinatura</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <Trash2 className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-medium">Tem certeza que deseja excluir?</p>
              <p className="text-sm text-muted-foreground">
                A assinatura <strong>{subscriptionToDelete?.name}</strong> será excluída permanentemente,
                incluindo todos os membros e histórico de pagamentos.
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Member Confirmation Dialog */}
      <Dialog open={deleteMemberDialogOpen} onClose={() => setDeleteMemberDialogOpen(false)}>
        <DialogClose onClose={() => setDeleteMemberDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>Remover Membro</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <UserMinus className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-medium">Tem certeza que deseja remover?</p>
              <p className="text-sm text-muted-foreground">
                O membro <strong>{memberToDelete?.member.name}</strong> será removido desta assinatura,
                incluindo todo o histórico de pagamentos.
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteMemberDialogOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDeleteMember}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Remover
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
