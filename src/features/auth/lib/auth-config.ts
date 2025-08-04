import { NextAuthOptions, User, Account, Profile } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import GitHubProvider from "next-auth/providers/github";
import GitlabProvider from "next-auth/providers/gitlab";
import { env } from "@/src/lib/config/environment";
import clientPromise from "@/src/lib/database/client";
import connectToDatabase from "@/src/lib/database/mongoose";
import { Organization, ProviderType, OrganizationType, InstallationStatus } from "@/src/lib/database/models";

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
    // Organization context
    organizations?: Array<{
      id: string;
      name: string;
      type: string;
      provider: string;
      installationStatus: string;
      repoCount: number;
    }>;
    currentOrganization?: {
      id: string;
      name: string;
      type: string;
      provider: string;
    };
  }
  interface JWT {
    uid?: string;
    gitlabAccessToken?: string;
    githubUsername?: string;
    organizations?: Array<{
      id: string;
      name: string;
      type: string;
      provider: string;
      installationStatus: string;
      repoCount: number;
    }>;
    currentOrganization?: {
      id: string;
      name: string;
      type: string;
      provider: string;
    };
  }
  interface User {
    githubUsername?: string;
  }
}

export async function saveGitLabOAuthInfo(
  user: User,
  account: Account,
  _profile?: Profile
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
 * Saves GitHub OAuth information and creates initial organization record
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

    // Extract GitHub username and organization info from profile
    const githubUsername = (profile as any)?.login || null;

    // Fetch user's GitHub information to get organization ID
    let githubOrgId = null;
    if (account.access_token) {
      try {
        // Fetch user's GitHub profile to get the user ID (which serves as personal org ID)
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${account.access_token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Platyfend-Dashboard'
          },
        });

        if (userResponse.ok) {
          const githubUser = await userResponse.json();
          githubOrgId = githubUser.id?.toString(); // GitHub user ID serves as personal org ID

          console.log("GitHub user info fetched:", {
            userId: user.id,
            githubUserId: githubUser.id,
            githubUsername: githubUser.login,
            githubOrgId
          });
        } else {
          console.warn("Failed to fetch GitHub user info:", userResponse.status);
        }
      } catch (fetchError) {
        console.warn("Error fetching GitHub user info:", fetchError);
        // Continue without org ID - not critical for authentication
      }
    }

    // Log successful OAuth data capture (without sensitive tokens)
    console.log("GitHub OAuth info captured for user:", {
      userId: user.id,
      email: user.email,
      provider: account.provider,
      scope: account.scope,
      hasAccessToken: !!account.access_token,
      githubUsername,
      githubOrgId
    });

    // Store GitHub username in user object for session access
    if (githubUsername) {
      // The username will be stored in the JWT token via the jwt callback
      user.githubUsername = githubUsername;
    }

    // Update the account record with GitHub-specific information
    if (user.id && (githubOrgId || githubUsername)) {
      try {
        const client = await clientPromise;
        const db = client.db('test'); // Use your database name
        const accountsCollection = db.collection('accounts');

        await accountsCollection.updateOne(
          {
            userId: user.id,
            provider: 'github',
            providerAccountId: account.providerAccountId
          },
          {
            $set: {
              githubOrgId: githubOrgId,
              githubUsername: githubUsername,
              updatedAt: new Date()
            }
          }
        );

        console.log("GitHub account info updated successfully:", {
          userId: user.id,
          githubOrgId,
          githubUsername
        });
      } catch (updateError) {
        console.error("Error updating GitHub account info:", updateError);
        // Don't throw - this is not critical for authentication
      }
    }

    // Create initial personal organization record for the user
    // This will have 0 repositories initially - repositories will be added via GitHub App installation
    await createInitialOrganization(user.id, githubUsername, githubOrgId);

  } catch (error) {
    console.error("Error in saveGitHubOAuthInfo:", error);
    throw error;
  }
}

/**
 * Creates initial personal organization record for GitHub user
 * Repositories will be added later via GitHub App installation
 */
async function createInitialOrganization(
  userId: string,
  githubUsername: string | null,
  githubOrgId: string | null
): Promise<void> {
  try {
    if (!githubUsername || !githubOrgId) {
      console.log("Missing GitHub username or org ID, skipping organization creation");
      return;
    }

    // Connect to database
    await connectToDatabase();

    // Check if organization already exists
    const existingOrg = await Organization.findOne({
      user_id: userId,
      org_id: githubOrgId,
      provider: ProviderType.GITHUB
    });

    if (existingOrg) {
      console.log(`Organization already exists for user ${userId} and GitHub org ${githubOrgId}`);
      return;
    }

    // Create new personal organization record
    const organization = new Organization({
      org_id: githubOrgId,
      user_id: userId,
      provider: ProviderType.GITHUB,
      org_name: githubUsername,
      org_type: OrganizationType.PERSONAL,
      installation_id: `pending-${Date.now()}`, // Temporary ID until GitHub App is installed
      installation_status: InstallationStatus.PENDING,
      permissions: {},
      repos: [], // Start with 0 repositories
      created_at: new Date(),
      updated_at: new Date()
    });

    await organization.save();

    console.log(`Created initial organization for user ${userId}:`, {
      orgId: githubOrgId,
      orgName: githubUsername,
      repoCount: 0
    });

  } catch (error: any) {
    console.error("Error creating initial organization:", error);
    if (error.errors) {
      console.error("Validation errors:", Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value
      })));
    }
    // Don't throw - this is not critical for authentication
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
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

        // Add organization context to session
        session.organizations = token.organizations as any;
        session.currentOrganization = token.currentOrganization as any;
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

      // Refresh organization data on each token refresh
      if (token.uid) {
        try {
          const organizations = await getUserOrganizations(token.uid as string);
          token.organizations = organizations;

          // Set current organization (first active one or first one)
          const currentOrg = organizations.find(org => org.installationStatus === 'active') || organizations[0];
          token.currentOrganization = currentOrg ? {
            id: currentOrg.id,
            name: currentOrg.name,
            type: currentOrg.type,
            provider: currentOrg.provider
          } : undefined;
        } catch (error) {
          console.error("Error loading organizations in JWT callback:", error);
          // Don't fail authentication if organization loading fails
          token.organizations = [];
          token.currentOrganization = undefined;
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

/**
 * Get user's organizations for session context
 */
async function getUserOrganizations(userId: string) {
  try {
    const organizations = await Organization.find({
      user_id: userId
    }).sort({ created_at: -1 });

    return organizations.map(org => ({
      id: org.org_id, // Use external org_id instead of MongoDB _id
      name: org.org_name,
      type: org.org_type,
      provider: org.provider,
      installationStatus: org.installation_status,
      repoCount: org.repos.length
    }));
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return [];
  }
}