import { InvitationsView } from "@/components/invitations/InvitationsView";

export default function InvitationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Invitaciones</h1>
        <p className="text-sm text-muted-foreground">
          Acepta o rechaza las invitaciones a equipos.
        </p>
      </header>

      <InvitationsView />
    </div>
  );
}
