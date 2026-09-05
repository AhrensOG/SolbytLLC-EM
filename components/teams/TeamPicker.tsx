"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search, Users, X } from "lucide-react";
import { useTeams } from "@/lib/hooks/useTeams";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { Team } from "@/types";

interface TeamPickerProps {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  teams?: Team[];
  label?: string;
  hint?: string;
}

export function TeamPicker({
  selected,
  onChange,
  teams,
  label = "Equipos",
  hint,
}: TeamPickerProps) {
  const { data: ownTeams } = useTeams();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const all = teams ?? ownTeams ?? [];
  const selectedTeams = all.filter((t) => selected.has(t.id));

  const filtered = all.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(teamId: string) {
    const next = new Set(selected);
    if (next.has(teamId)) next.delete(teamId);
    else next.add(teamId);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Users className="h-4 w-4 text-muted-foreground" />
        {label}
        {selected.size > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {selected.size}
          </span>
        )}
      </span>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
          open
            ? "border-primary bg-muted/50"
            : "border-border text-muted-foreground hover:bg-muted/50",
        )}
      >
        {selected.size === 0
          ? `Selecciona ${label.toLowerCase()}…`
          : `${selected.size} ${selected.size === 1 ? "seleccionado" : "seleccionados"}`}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label={`Buscar ${label.toLowerCase()}`}
                  placeholder="Buscar…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ul className="max-h-64 flex-col gap-1 overflow-y-auto">
                {filtered.map((team, index) => {
                  const checked = selected.has(team.id);
                  return (
                    <motion.li
                      key={team.id}
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.18,
                        ease: "easeOut",
                        delay: index * 0.03,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(team.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted",
                          checked && "bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-colors",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border",
                          )}
                        >
                          {checked ? "✓" : ""}
                        </span>
                        <span className="flex-1 truncate text-sm font-medium text-card-foreground">
                          {team.name}
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
                {filtered.length === 0 && (
                  <li className="px-2 py-3 text-center text-sm text-muted-foreground">
                    No se encontraron equipos
                  </li>
                )}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedTeams.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTeams.map((team) => (
            <span
              key={team.id}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {team.name}
              <button
                type="button"
                aria-label={`Quitar ${team.name}`}
                onClick={() => {
                  const next = new Set(selected);
                  next.delete(team.id);
                  onChange(next);
                }}
                className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}