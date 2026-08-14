import { CategoriesView } from "@/components/categories/CategoriesView";

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Categorías</h1>
        <p className="text-sm text-muted-foreground">
          Organiza tus ingresos y gastos.
        </p>
      </header>

      <CategoriesView />
    </div>
  );
}
