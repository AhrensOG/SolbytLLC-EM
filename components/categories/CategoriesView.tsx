"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import {
  CheckSquare,
  Pencil,
  Plus,
  Share2,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useCategories } from "@/lib/hooks/useCategories";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CategoryForm } from "./CategoryForm";
import { ShareModal } from "@/components/share/ShareModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import type { Category, ShareResult } from "@/types";
import { cn } from "@/lib/cn";

export function CategoriesView() {
  const { mutate } = useSWRConfig();
  const { data: categories, isLoading } = useCategories();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);

  const income = (categories ?? []).filter((c) => c.type === "income");
  const expense = (categories ?? []).filter((c) => c.type === "expense");

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function handleShare(teamIds: string[]): Promise<void> {
    const res = await fetch("/api/share/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds: [...selected], teamIds }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error ?? "No se pudo compartir");
      return;
    }

    const result: ShareResult = await res.json();
    toast.success(
      `${result.created} creada${result.created === 1 ? "" : "s"}${
        result.skipped > 0
          ? ` · ${result.skipped} ya existían y se saltaron`
          : ""
      }`,
    );
    await mutate((key) => typeof key === "string" && key.startsWith("/api/teams"));
    exitSelectMode();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingLoading(true);
    const res = await fetch(`/api/categories/${deleting.id}`, { method: "DELETE" });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeletingLoading(false);
      toast.error(body?.error ?? "No se pudo eliminar la categoría");
      return;
    }

    setDeletingLoading(false);
    setDeleting(null);
    toast.success("Categoría eliminada");
    await mutate((key) => typeof key === "string" && key.startsWith("/api/categories"));
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
              className={cn(
                "group flex items-center gap-3 rounded-xl border bg-card p-3",
                selectMode && selected.has(cat.id)
                  ? "border-primary"
                  : "border-border",
              )}
              onClick={
                selectMode ? () => toggleSelect(cat.id) : undefined
              }
              role={selectMode ? "checkbox" : undefined}
              aria-checked={selectMode ? selected.has(cat.id) : undefined}
            >
              {selectMode && (
                <input
                  type="checkbox"
                  checked={selected.has(cat.id)}
                  onChange={() => toggleSelect(cat.id)}
                  aria-label={`Seleccionar ${cat.name}`}
                  className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                />
              )}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${cat.color}1f` }}
              >
                <CategoryIcon name={cat.icon} className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              <span className="flex-1 truncate text-sm font-medium text-card-foreground">
                {cat.name}
              </span>
              {!selectMode && (
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
              )}
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
            title="No hay categorías"
            description="Crea categorías para organizar tus ingresos y gastos."
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Crear categoría
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {selectMode && (
            <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-3">
              <span className="text-sm font-medium text-card-foreground">
                {selected.size} seleccionada{selected.size === 1 ? "" : "s"}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={selected.size === 0}
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="h-4 w-4" /> Compartir a equipos
                </Button>
                <Button size="sm" variant="ghost" onClick={exitSelectMode}>
                  <X className="h-4 w-4" /> Cancelar
                </Button>
              </div>
            </div>
          )}
          {renderGroup(expense, "Gastos")}
          {renderGroup(income, "Ingresos")}
          {selectMode ? (
            <span />
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Nueva categoría
              </Button>
              <Button variant="outline" onClick={() => setSelectMode(true)}>
                <CheckSquare className="h-4 w-4" /> Seleccionar
              </Button>
            </div>
          )}
        </>
      )}

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Compartir categorías a equipos"
        description={`Las ${selected.size} categorías seleccionadas se crearán en los equipos elegidos (se saltan las que ya existen con el mismo nombre).`}
        onConfirm={handleShare}
      />

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva categoría">
        <CategoryForm onSuccess={() => setCreating(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar categoría">
        {editing && <CategoryForm category={editing} onSuccess={() => setEditing(null)} />}
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
