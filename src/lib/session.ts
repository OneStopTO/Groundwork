import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export interface SessionData {
  contractorId?: string;
}

const sessionSecret =
  process.env.SESSION_SECRET ?? "dev-only-secret-change-me-32-characters-min";

export const sessionOptions = {
  password: sessionSecret,
  cookieName: "landscape-quote-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getCurrentContractor() {
  const session = await getSession();
  if (!session.contractorId) return null;
  return prisma.contractor.findUnique({ where: { id: session.contractorId } });
}

export async function requireContractor() {
  const contractor = await getCurrentContractor();
  if (!contractor) {
    redirect("/login");
  }
  return contractor;
}
