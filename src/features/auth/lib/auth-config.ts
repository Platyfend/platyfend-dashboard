import { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import GitHubProvider from "next-auth/providers/github";
import GitlabProvider from "next-auth/providers/gitlab";
import { env } from "@/src/lib/config/environment";
import client from "@/src/lib/database/client";
import { saveGitHubOAuthInfo } from "./github";
import { saveGitLabOAuthInfo } from "./gitlab";

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
  adapter: MongoDBAdapter(client),
  providers: [
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "user:email read:org",
        },
      },
    }),
    GitlabProvider({
      clientId: env.GITLAB_CLIENT_ID,
      clientSecret: env.GITLAB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "read_user read_api read_repository api", 
        },
      },
    }),
    // Add more providers as needed
    // AzureADProvider, etc.
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Validate that we have the required authentication data
      if (!user || !account) {
        console.error("Missing user or account data in signIn callback");
        return false;
      }

      // Handle GitHub OAuth specifically
      if (account.provider === "github" && account.access_token) {
        try {
          // Save GitHub OAuth information for workspace integration
          await saveGitHubOAuthInfo(user, account, profile);
        } catch (error) {
          console.error("Error saving GitHub OAuth info:", error);
          
        }
      } else if (account.provider === "gitlab" && account.access_token) {
        // Handle GitLab OAuth
        try {
          await saveGitLabOAuthInfo(user, account, profile);
        } catch (error) {
          console.error("Error saving GitLab OAuth info:", error);
        } 
      }

      // Additional validation can be added here for other providers
      // For example: email domain restrictions, organization membership, etc.

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