import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/src/lib/auth"
import { prisma } from "@/src/lib/database/prisma"
import { getGitHubOrganizations, createOrUpdateWorkspaceFromGitHubOrg } from "@/src/lib/vcs/vcs-service"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find user's GitHub VCS installations
    const githubProvider = await prisma.vCSProvider.findFirst({
      where: { type: "github" }
    })

    if (!githubProvider) {
      return NextResponse.json({ error: "GitHub provider not found" }, { status: 404 })
    }

    const vcsInstallations = await prisma.vCSInstallation.findMany({
      where: {
        userId: session.user.id,
        providerId: githubProvider.id,
        accessToken: {
          not: null
        }
      }
    })

    if (vcsInstallations.length === 0) {
      return NextResponse.json({ error: "No GitHub installations found" }, { status: 404 })
    }

    let totalSynced = 0

    // Process each VCS installation
    for (const installation of vcsInstallations) {
      if (!installation.accessToken) continue

      try {
        // Fetch GitHub organizations for this installation
        const organizations = await getGitHubOrganizations(installation.accessToken)
        
        // Add user's personal account as an organization
        const userOrg = {
          id: installation.accountId,
          login: installation.accountLogin,
          name: installation.accountLogin,
          avatar_url: null,
          type: "User"
        }
        
        const allOrganizations = [userOrg, ...organizations]

        // Process each organization
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
        // Continue with other installations
      }
    }

    return NextResponse.json({ 
      message: "GitHub organizations synced successfully",
      synced: totalSynced
    })
  } catch (error) {
    console.error("Error syncing GitHub organizations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
