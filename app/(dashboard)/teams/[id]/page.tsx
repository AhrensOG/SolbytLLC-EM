import { TeamDashboardView } from "@/components/teams/TeamDashboardView";

export default async function TeamDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TeamDashboardView teamId={id} />;
}
