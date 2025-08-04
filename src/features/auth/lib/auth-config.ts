import { NextAuthOptions, User, Account, Profile } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import GitHubProvider from "next-auth/providers/github";
import GitlabProvider from "next-auth/providers/gitlab";
import { env } from "@/src/lib/config/environment";
import client from "@/src/lib/database/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      githubUsername?: string | null;
    };
    // make GitLab token available on the session object
    gitlabAccessToken?: string;
  }
  interface JWT {
    uid?: string;
    gitlabAccessToken?: string;
    githubUsername?: string;
  }
  interface User {
    githubUsername?: string;
  }
}

export async function saveGitLabOAuthInfo(
  user: User,
  account: Account,
  profile?: Profile
): Promise<void> {
  try {
    // Validate required OAuth data
    if (!account.access_token) {
      throw new Error("GitLab access token is required");
    }
    if (!user.email) {
      throw new Error("User email is required for GitLab integration");
    }

    // Log successful OAuth data capture (without sensitive tokens)
    console.log("GitLab OAuth info captured for user:", {
      userId: user.id,
      email: user.email,
      provider: account.provider,
      scope: account.scope,
      hasAccessToken: !!account.access_token
    });

    // Skip webhook setup for localhost
    const baseUrl = process.env.NEXTAUTH_URL;
    if (baseUrl?.includes('localhost') || baseUrl?.includes('127.0.0.1')) {
      console.log("Skipping webhook setup in local development");
      return;
    }
  } catch (error) {
    console.error("Error in saveGitLabOAuthInfo:", error);
    throw error;
  }
}

/**
 * Saves GitHub OAuth information for workspace and repository integration
 * This function handles the OAuth data received during GitHub authentication
 */
export async function saveGitHubOAuthInfo(
  user: User,
  account: Account,
  profile?: Profile
): Promise<void> {
  try {
    // Validate required OAuth data
    if (!account.access_token) {
      throw new Error("GitHub access token is required");
    }

    if (!user.email) {
      throw new Error("User email is required for GitHub integration");
    }

    // Extract GitHub username from profile
    const githubUsername = (profile as any)?.login || null;

    // Log successful OAuth data capture (without sensitive tokens)
    console.log("GitHub OAuth info captured for user:", {
      userId: user.id,
      email: user.email,
      provider: account.provider,
      scope: account.scope,
      hasAccessToken: !!account.access_token,
      githubUsername
    });

    // Store GitHub username in user object for session access
    if (githubUsername) {
      // The username will be stored in the JWT token via the jwt callback
      user.githubUsername = githubUsername;
    }

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
        session.user.githubUsername = (token.githubUsername as string) || null;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id;
        if (user.githubUsername) {
          token.githubUsername = user.githubUsername;
        }
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