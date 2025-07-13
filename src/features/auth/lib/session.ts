import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-config";

export async function verifySession() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function requireAuth() {
  const session = await verifySession();
  if (!session) {
    throw new Error("Authentication required");
  }
  return session;
}
