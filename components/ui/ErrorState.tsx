"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "No se pudieron cargar los datos.",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </Card>
  );
}
