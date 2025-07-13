import { prisma } from "@/src/lib/prisma"

/**
 * Get VCS installation for a user by provider type
 */
export async function getVCSInstallationByUser(userId: string, providerType: "github" | "gitlab" | "bitbucket") {
  // Find the VCS provider
  const vcsProvider = await prisma.vCSProvider.findFirst({
    where: { type: providerType }
  })

  if (!vcsProvider) {
    return null
  }

  // Find the VCS installation directly by userId and providerId
  const installation = await prisma.vCSInstallation.findFirst({
    where: {
      userId: userId,
      providerId: vcsProvider.id,
    },
    include: {
      provider: true,
      repositories: true
    }
  })

  return installation
}

/**
 * Get all repositories for a user from a specific VCS provider
 */
export async function getUserRepositories(userId: string, providerType: "github" | "gitlab" | "bitbucket") {
  const installation = await getVCSInstallationByUser(userId, providerType)
  
  if (!installation) {
    return []
  }

  return installation.repositories
}

/**
 * Get VCS access token for a user
 */
export async function getVCSAccessToken(userId: string, providerType: "github" | "gitlab" | "bitbucket") {
  const installation = await getVCSInstallationByUser(userId, providerType)
  return installation?.accessToken || null
}

/**
 * Check if VCS token is expired
 */
export function isVCSTokenExpired(installation: { tokenExpiresAt: Date | null }) {
  if (!installation.tokenExpiresAt) {
    return false // No expiration set, assume it's valid
  }
  
  return new Date() > installation.tokenExpiresAt
}

/**
 * Refresh repositories for a VCS installation
 */
export async function refreshRepositories(installationId: string) {
  const installation = await prisma.vCSInstallation.findUnique({
    where: { id: installationId },
    include: { provider: true }
  })

  if (!installation || !installation.accessToken) {
    throw new Error("Installation not found or no access token")
  }

  if (isVCSTokenExpired(installation)) {
    throw new Error("Access token has expired")
  }

  // Only GitHub is implemented for now
  if (installation.provider.type === "github") {
    return await refreshGitHubRepositories(installation)
  }

  throw new Error(`Provider ${installation.provider.type} not supported yet`)
}

async function refreshGitHubRepositories(installation: any) {
  const response = await fetch("https://api.github.com/user/repos?per_page=100", {
    headers: {
      "Authorization": `Bearer ${installation.accessToken}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Platyfend-CodeReview"
    }
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  const repositories = await response.json()

  // Update repositories in database
  const updatedRepos = []
  for (const repo of repositories) {
    try {
      const updatedRepo = await prisma.repository.upsert({
        where: {
          vcsInstallationId_externalId: {
            vcsInstallationId: installation.id,
            externalId: repo.id.toString()
          }
        },
        update: {
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          defaultBranch: repo.default_branch || "main"
        },
        create: {
          vcsInstallationId: installation.id,
          externalId: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          defaultBranch: repo.default_branch || "main"
        }
      })
      updatedRepos.push(updatedRepo)
    } catch (error) {
      console.error(`Error updating repository ${repo.full_name}:`, error)
    }
  }

  return updatedRepos
}

/**
 * Get GitHub user info using access token
 */
export async function getGitHubUserInfo(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Platyfend-CodeReview"
    }
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}
