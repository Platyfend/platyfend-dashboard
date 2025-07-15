import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/database/prisma"
import { getGitHubOrganizations } from "@/src/lib/vcs/vcs-service"

/**
 * Create or update workspace based on GitHub org or user account
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
    const slug = org.login.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Check if workspace already exists by slug
    let workspace = await prisma.workspace.findUnique({
      where: { slug }
    })

    if (!workspace) {
      // Create new workspace with user as owner
      workspace = await prisma.workspace.create({
        data: {
          name: org.login,
          slug,
          source: "github",
          members: {
            create: {
              userId,
              role: "owner"
            }
          }
        }
      })

      console.log(`Created workspace for GitHub org/user: ${org.login}`)
    } else {
      // Check if user is already a member
      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: workspace.id,
          userId
        }
      })

      if (!member) {
        await prisma.workspaceMember.create({
          data: {
            userId,
            workspaceId: workspace.id,
            role: "member"
          }
        })

        console.log(`Added user ${userId} as member to existing workspace: ${org.login}`)
      }
    }

    // Find existing VCS installation for this user/org
    const existingInstallation = await prisma.vCSInstallation.findFirst({
      where: {
        userId,
        providerId,
        accountLogin: org.login
      }
    })

    if (!existingInstallation) {
      await prisma.vCSInstallation.create({
        data: {
          userId,
          providerId,
          installationId: org.id,
          accountId: org.id,
          accountLogin: org.login,
          accessToken,
          tokenExpiresAt: expiresAt ? new Date(expiresAt * 1000) : null,
          workspaceId: workspace.id
        }
      })

      console.log(`Created VCS installation for ${org.login} linked to workspace`)
    } else {
      await prisma.vCSInstallation.update({
        where: { id: existingInstallation.id },
        data: {
          accessToken,
          tokenExpiresAt: expiresAt ? new Date(expiresAt * 1000) : null,
          workspaceId: workspace.id
        }
      })

      console.log(`Updated VCS installation for ${org.login}`)
    }

    return workspace
  } catch (error) {
    console.error(`Error in createOrUpdateWorkspaceFromGitHubOrg for ${org.login}:`, error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure GitHub provider exists, create if missing
    let githubProvider = await prisma.vCSProvider.findFirst({
      where: { type: "github" }
    })

    if (!githubProvider) {
      githubProvider = await prisma.vCSProvider.create({
        data: {
          type: "github",
          name: "GitHub"
        }
      })
    }

    // Find user's GitHub VCS installations with access tokens
    const vcsInstallations = await prisma.vCSInstallation.findMany({
      where: {
        userId: session.user.id,
        providerId: githubProvider.id,
        accessToken: { not: null }
      }
    })

    if (vcsInstallations.length === 0) {
      return NextResponse.json({ error: "No GitHub installations found" }, { status: 404 })
    }

    let totalSynced = 0

    for (const installation of vcsInstallations) {
      if (!installation.accessToken) continue

      try {
        // Get GitHub organizations for this installation
        const organizations = await getGitHubOrganizations(installation.accessToken)

        // Include user personal account as an org-like object
        const userOrg = {
          id: installation.accountId,
          login: installation.accountLogin,
          name: installation.accountLogin,
          avatar_url: null,
          type: "User"
        }

        const allOrganizations = [userOrg, ...organizations]

        // Sync each organization
        for (const org of allOrganizations) {
          await createOrUpdateWorkspaceFromGitHubOrg(
            session.user.id,
            githubProvider.id,
            org,
            installation.accessToken,
            installation.tokenExpiresAt ? Math.floor(installation.tokenExpiresAt.getTime() / 1000) : null
          )
          totalSynced++
        }
      } catch (error) {
        console.error(`Error syncing organizations for installation ${installation.id}:`, error)
      }
    }

    return NextResponse.json({
      message: "GitHub organizations synced successfully",
      synced: totalSynced
    })
  } catch (error) {
    console.error("Error syncing GitHub organizations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
