"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useTeamCategories } from "@/lib/hooks/useTeamCategories";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import type { Category } from "@/types";

export function TeamCategoriesView({ teamId }: { teamId: string }) {
  const { mutate } = useSWRConfig();
  const { data: categories, isLoading } = useTeamCategories(teamId);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const income = (categories ?? []).filter((c) => c.type === "income");
  const expense = (categories ?? []).filter((c) => c.type === "expense");

  async function handleDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    const res = await fetch(`/api/teams/${teamId}/categories/${deleting.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeletingLoading(false);
      toast.error(body?.error ?? "No se pudo eliminar la categoría");
      return;
    }

    setDeletingLoading(false);
    setDeleting(null);
    toast.success("Categoría eliminada");
    await mutate((key) => typeof key === "string" && key.startsWith(`/api/teams/${teamId}`));
  }

  function renderGroup(list: Category[], title: string) {
    if (list.length === 0) return null;
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {list.map((cat) => (
            <div
              key={cat.id}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${cat.color}1f` }}
              >
                <CategoryIcon name={cat.icon} className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              <span className="flex-1 truncate text-sm font-medium text-card-foreground">
                {cat.name}
              </span>
              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setEditing(cat)}
                  aria-label="Editar"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleting(cat)}
                  aria-label="Eliminar"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {isLoading ? (
        <PageLoader />
      ) : income.length === 0 && expense.length === 0 ? (
        <Card>
          <EmptyState
            icon={Tag}
            title="No hay categorías en el equipo"
            description="Crea categorías compartidas para organizar los movimientos del equipo."
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Crear categoría
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {renderGroup(expense, "Gastos")}
          {renderGroup(income, "Ingresos")}
          <Button variant="outline" onClick={() => setCreating(true)} className="self-start">
            <Plus className="h-4 w-4" /> Nueva categoría
          </Button>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva categoría">
        <CategoryForm teamId={teamId} onSuccess={() => setCreating(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar categoría">
        {editing && (
          <CategoryForm teamId={teamId} category={editing} onSuccess={() => setEditing(null)} />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar categoría">
        <p className="text-sm text-muted-foreground">
          ¿Seguro que quieres eliminar la categoría{" "}
          <span className="font-medium text-card-foreground">{deleting?.name}</span>?
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button variant="destructive" loading={deletingLoading} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
