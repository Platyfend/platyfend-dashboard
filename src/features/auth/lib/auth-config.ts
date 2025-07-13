import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/src/lib/database/prisma";
import { Account } from "next-auth";
import { saveGitHubOAuthInfo } from "@/src/lib/vcs/vcs-service";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "user:email read:org",
        },
      },
    }),
    // Add more providers as needed
    // GitLabProvider, AzureADProvider, etc.
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && account.access_token) {
        try {
          await saveGitHubOAuthInfo(user, account, profile);
        } catch (error) {
          console.error("Error saving GitHub OAuth info:", error);
          // Don't block sign-in if VCS info saving fails
        }
      }
      return true;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
    redirect: async ({ url, baseUrl }) => {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      // Default redirect to dashboard after successful login
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};
