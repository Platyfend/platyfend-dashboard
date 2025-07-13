import { prisma } from "@/src/lib/database/prisma";
import { Octokit } from "@octokit/rest";
import type { Account, User } from "next-auth";

/**
 * Save GitHub OAuth information for a user and create workspaces from organizations
 */
export async function saveGitHubOAuthInfo(
  user: User,
  account: Account,
  profile: any
) {
  if (!user.id || !account.access_token) {
    throw new Error("Missing required user or account information");
  }

  try {
    // Check if VCS provider exists
    let provider = await prisma.vCSProvider.findFirst({
      where: { type: "github" },
    });

    if (!provider) {
      provider = await prisma.vCSProvider.create({
        data: {
          type: "github",
          name: "GitHub",
        },
      });
    }

    // Check if VCS installation already exists
    const existingInstallation = await prisma.vCSInstallation.findFirst({
      where: {
        userId: user.id,
        providerId: provider.id,
      },
    });

    if (!existingInstallation) {
      // Create new VCS installation record
      await prisma.vCSInstallation.create({
        data: {
          userId: user.id,
          providerId: provider.id,
          installationId: account.providerAccountId,
          accountId: profile?.id?.toString() || account.providerAccountId,
          accountLogin: profile?.login || profile?.username || user.name || "unknown",
          accessToken: account.access_token,
          tokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
        },
      });

      console.log(`Created VCS installation for GitHub user: ${profile?.login || user.name}`);
    } else {
      // Update existing installation with new token info
      await prisma.vCSInstallation.update({
        where: { id: existingInstallation.id },
        data: {
          accessToken: account.access_token,
          tokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
          accountLogin: profile?.login || profile?.username || user.name || existingInstallation.accountLogin,
        },
      });

      console.log(`Updated VCS installation for GitHub user: ${profile?.login || user.name}`);
    }

    // Note: We don't create workspaces here during OAuth to avoid timing issues
    // Workspaces will be created later via the sync endpoint or when needed

    console.log(`Saved GitHub OAuth info for user: ${profile?.login || user.name}`);
  } catch (error) {
    console.error("Error in saveGitHubOAuthInfo:", error);
    throw error;
  }
}

/**
 * Get GitHub repositories for a user
 */
export async function getGitHubRepositories(
  accessToken: string,
  page = 1,
  perPage = 30
) {
  const octokit = new Octokit({
    auth: accessToken,
  });

  const response = await octokit.repos.listForAuthenticatedUser({
    page,
    per_page: perPage,
    sort: "updated",
    direction: "desc",
  });

  return response.data.map((repo) => ({
    id: repo.id.toString(),
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    isPrivate: repo.private,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
  }));
}

/**
 * Get GitHub user info using access token
 */
export async function getGitHubUserInfo(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${accessToken}`,
      "User-Agent": "Platyfend",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub user info");
  }

  return response.json();
}

/**
 * Get GitHub organizations for a user
 */
export async function getGitHubOrganizations(accessToken: string) {
  const octokit = new Octokit({
    auth: accessToken,
  });

  try {
    const response = await octokit.orgs.listForAuthenticatedUser({
      per_page: 100, // Get up to 100 organizations
    });

    return response.data.map((org) => ({
      id: org.id.toString(),
      login: org.login,
      name: org.login, // Use login as name for organizations
      avatar_url: org.avatar_url,
      type: "Organization"
    }));
  } catch (error) {
    console.error("Error fetching GitHub organizations:", error);
    return []; // Return empty array if we can't fetch organizations
  }
}

/**
 * Create or update workspace from GitHub organization
 */
export async function createOrUpdateWorkspaceFromGitHubOrg(
  userId: string,
  providerId: string,
  org: any,
  accessToken: string,
  expiresAt?: number | null
) {
  try {
    // Generate slug from organization login
    const slug = org.login.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if workspace already exists for this organization
    let workspace = await prisma.workspace.findFirst({
      where: {
        slug: slug,
        source: "github"
      },
      include: {
        installations: true,
        members: true
      }
    });

    if (!workspace) {
      // Verify user exists before creating workspace
      const userExists = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!userExists) {
        console.error(`User ${userId} not found when creating workspace for ${org.login}`);
        throw new Error(`User ${userId} not found`);
      }

      // Create new workspace for the organization
      workspace = await prisma.workspace.create({
        data: {
          name: org.login,
          slug: slug,
          source: "github",
          members: {
            create: {
              userId: userId,
              role: "owner"
            }
          }
        },
        include: {
          installations: true,
          members: true
        }
      });

      console.log(`Created workspace for GitHub ${org.type}: ${org.login}`);
    } else {
      // Check if user is already a member
      const existingMember = workspace.members?.find((member: any) => member.userId === userId);

      if (!existingMember) {
        // Add user as member if not already a member
        await prisma.workspaceMember.create({
          data: {
            userId: userId,
            workspaceId: workspace.id,
            role: "member"
          }
        });

        console.log(`Added user to existing workspace for GitHub ${org.type}: ${org.login}`);
      }
    }

    // Check if VCS installation already exists for this user and organization
    const existingInstallation = await prisma.vCSInstallation.findFirst({
      where: {
        userId: userId,
        providerId: providerId,
        accountLogin: org.login
      }
    });

    if (!existingInstallation) {
      // Create VCS installation linked to workspace
      await prisma.vCSInstallation.create({
        data: {
          userId: userId,
          providerId: providerId,
          installationId: org.id,
          accountId: org.id,
          accountLogin: org.login,
          accessToken: accessToken,
          tokenExpiresAt: expiresAt ? new Date(expiresAt * 1000) : null,
          workspaceId: workspace.id
        }
      });

      console.log(`Created VCS installation for ${org.login} linked to workspace`);
    } else {
      // Update existing installation
      await prisma.vCSInstallation.update({
        where: { id: existingInstallation.id },
        data: {
          accessToken: accessToken,
          tokenExpiresAt: expiresAt ? new Date(expiresAt * 1000) : null,
          workspaceId: workspace.id
        }
      });

      console.log(`Updated VCS installation for ${org.login}`);
    }

    return workspace;
  } catch (error) {
    console.error(`Error creating/updating workspace for GitHub ${org.type} ${org.login}:`, error);
    throw error;
  }
}
