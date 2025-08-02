import { NextRequest } from 'next/server'
import { authOptions } from '@/src/features/auth/lib/auth-config'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import client from '@/src/lib/database/client'
import { vcsService } from '@/src/lib/vcs'
import {
  findWorkspace,
  formatWorkspace,
  formatInstallation,
  createNoVCSAccountsError,
  createNoInstallationsError
} from '@/src/lib/vcs/utils'

export async function GET(_request: NextRequest) {
    try {
        // Step 1: User Authentication (unchanged)
        const session = await getServerSession(authOptions)

        if (!session || !session.user?.id) {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'User must be logged in to access repositories'
            }, { status: 401 })
        }

        // Connect to MongoDB
        await client.connect()
        const db = client.db('platyfend')
        const accountsCollection = db.collection('accounts')
        const workspacesCollection = db.collection('workspaces')
        const repositoriesCollection = db.collection('repositories')
        const installationsCollection = db.collection('vcs_installations')

        // Step 2: VCS Provider Detection
        const vcsDetectionResult = await vcsService.detectLinkedProviders(
            session.user.id,
            accountsCollection
        )

        if (vcsDetectionResult.linkedProviders.length === 0) {
            return NextResponse.json(
                createNoVCSAccountsError(vcsDetectionResult.missingProviders),
                { status: 403 }
            )
        }

        // Step 3: Workspace Management
        const userWorkspace = await findWorkspace(session.user, workspacesCollection)

        if (!userWorkspace) {
            return NextResponse.json({
                error: 'No workspace found',
                message: 'Please connect repositories to create a workspace first',
                requiresWorkspaceSetup: true
            }, { status: 404 })
        }

        // Step 4: Multi-Provider Installation Check
        const installationCheckResult = await vcsService.checkInstallations(
            vcsDetectionResult.linkedProviders,
            userWorkspace,
            installationsCollection
        )

        if (installationCheckResult.activeInstallations.length === 0) {
            return NextResponse.json(
                createNoInstallationsError(
                    vcsDetectionResult.linkedProviders.map(lp => lp.provider),
                    installationCheckResult.installationUrls
                ),
                { status: 403 }
            )
        }

        // Step 5: Provider-Specific Repository Fetching
        const allRepositories = await vcsService.fetchAllRepositories(
            installationCheckResult.activeInstallations,
            repositoriesCollection,
            userWorkspace._id.toString()
        )

        // Create VCS connections object for response
        const vcsConnections = Object.fromEntries(
            installationCheckResult.activeInstallations.map(({ provider, installation }) => [
                provider,
                formatInstallation(installation)
            ])
        )

        return NextResponse.json({
            repositories: allRepositories,
            workspace: formatWorkspace(userWorkspace),
            vcsConnections: vcsConnections,
            missingProviders: Object.keys(installationCheckResult.installationUrls),
            installationUrls: installationCheckResult.installationUrls
        })

    } catch (error) {
        console.error('Error in repositories API:', error)
        return NextResponse.json({
            error: 'Internal server error',
            message: 'An unexpected error occurred while fetching repositories'
        }, { status: 500 })
    } finally {
        // Close the connection (optional in serverless environments)
        // await client.close()
    }
}