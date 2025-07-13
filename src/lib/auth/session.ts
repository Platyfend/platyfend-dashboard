import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";

export async function verifySession() {
  const session = await getServerSession(authOptions);
  return session;
}