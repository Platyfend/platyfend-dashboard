import { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import GitHubProvider from "next-auth/providers/github";
import { env } from "@/src/lib/config/environment";
import client from "@/src/lib/database/client";
import type { User, Account, Profile } from "next-auth";

/**
 * Saves GitHub OAuth information for workspace and repository integration
 * This function handles the OAuth data received during GitHub authentication
 */
async function saveGitHubOAuthInfo(
  user: User,
  account: Account,
  profile?: Profile // Reserved for future use (GitHub profile data)
): Promise<void> {
  try {
    // Validate required OAuth data
    if (!account.access_token) {
      throw new Error("GitHub access token is required");
    }

    if (!user.email) {
      throw new Error("User email is required for GitHub integration");
    }

    // Log successful OAuth data capture (without sensitive tokens)
    console.log("GitHub OAuth info captured for user:", {
      userId: user.id,
      email: user.email,
      provider: account.provider,
      scope: account.scope,
      hasAccessToken: !!account.access_token
    });

    // TODO: Implement workspace creation and GitHub integration
    // This would typically involve:
    // 1. Creating a default workspace for the user
    // 2. Storing encrypted GitHub tokens for repository access
    // 3. Setting up webhook configurations
    // 4. Syncing user's GitHub organizations and repositories

  } catch (error) {
    console.error("Error in saveGitHubOAuthInfo:", error);
    throw error;
  }
}

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
    // Add more providers as needed
    // GitLabProvider, AzureADProvider, etc.
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
          // Don't block sign-in if VCS info saving fails
          // This allows users to still authenticate even if workspace setup fails
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
