import { auth } from "@/auth";
import { TeamMember, User } from "@/lib/models";

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getSessionUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return User.findByPk(userId);
}

export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}

export async function requireMembership(teamId: string) {
  const userId = await requireUserId();
  const member = await TeamMember.findOne({ where: { teamId, userId } });
  if (!member) {
    throw new Error("FORBIDDEN");
  }
  return member;
}

export async function requireAdmin(teamId: string) {
  const member = await requireMembership(teamId);
  if (member.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return member;
}
