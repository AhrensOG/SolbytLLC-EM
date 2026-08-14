import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { getTeamForUser } from "@/lib/team-data";
import { TeamTabs } from "@/components/teams/TeamTabs";

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getTeamForUser(id);
  if (!result) redirect("/teams");

  const { team, role } = result;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/teams"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Equipos
        </Link>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate text-2xl font-bold text-foreground">
              {team.name}
              {role === "admin" && (
                <Shield className="h-5 w-5 shrink-0 text-solbyt-purple-500" />
              )}
            </h1>
            {team.description && (
              <p className="truncate text-sm text-muted-foreground">
                {team.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <TeamTabs teamId={id} />
      {children}
    </div>
  );
}
