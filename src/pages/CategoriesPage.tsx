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
import { useToast } from "@/components/ui/toast";
import type { Category, CreateCategoryDto, TransactionType } from "@/types";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: "",
    type: "EXPENSE",
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await window.api.categories.getAll();
      setCategories(data);
    } catch (error) {
      addToast({
        title: "Erro ao carregar categorias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingCategory(null);
    setFormData({ name: "", type: "EXPENSE" });
    setDialogOpen(true);
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      parentId: category.parentId || undefined,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingCategory) {
        await window.api.categories.update(editingCategory.id, formData);
        addToast({ title: "Categoria atualizada!", variant: "success" });
      } else {
        await window.api.categories.create(formData);
        addToast({ title: "Categoria criada!", variant: "success" });
      }
      setDialogOpen(false);
      loadCategories();
    } catch (error) {
      addToast({ title: "Erro ao salvar categoria", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir esta categoria?")) return;
    try {
      await window.api.categories.delete(id);
      addToast({ title: "Categoria excluída!", variant: "success" });
      loadCategories();
    } catch (error) {
      addToast({ title: "Erro ao excluir categoria", variant: "destructive" });
    }
  }

  const incomeCategories = categories.filter(
    (c) => c.type === "INCOME" && !c.parentId,
  );
  const expenseCategories = categories.filter(
    (c) => c.type === "EXPENSE" && !c.parentId,
  );
  const parentCategories = categories.filter(
    (c) => !c.parentId && c.type === formData.type,
  );

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
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">
            Organize suas transações por categoria
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <Tags className="h-5 w-5" />
              Categorias de Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {incomeCategories.map((category) => (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="font-medium">{category.name}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {category.children && category.children.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {category.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-2"
                        >
                          <span className="text-sm">{child.name}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(child)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(child.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {incomeCategories.length === 0 && (
                <p className="text-center text-muted-foreground">
                  Nenhuma categoria de receita
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <Tags className="h-5 w-5" />
              Categorias de Despesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenseCategories.map((category) => (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="font-medium">{category.name}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {category.children && category.children.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {category.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-2"
                        >
                          <span className="text-sm">{child.name}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(child)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(child.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {expenseCategories.length === 0 && (
                <p className="text-center text-muted-foreground">
                  Nenhuma categoria de despesa
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogClose onClose={() => setDialogOpen(false)} />
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Editar Categoria" : "Nova Categoria"}
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
                placeholder="Nome da categoria"
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
                    type: e.target.value as TransactionType,
                    parentId: undefined,
                  })
                }
              >
                <option value="INCOME">Receita</option>
                <option value="EXPENSE">Despesa</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">
                Categoria Pai (opcional)
              </label>
              <Select
                value={formData.parentId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parentId: e.target.value || undefined,
                  })
                }
              >
                <option value="">Nenhuma (categoria principal)</option>
                {parentCategories
                  .filter((c) => c.id !== editingCategory?.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </Select>
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
