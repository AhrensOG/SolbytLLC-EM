import { auth } from "@/auth";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = (session?.user?.name ?? "").split(" ")[0];

  return <DashboardView firstName={firstName} />;
}
