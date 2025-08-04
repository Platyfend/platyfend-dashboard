import { NextRequest } from 'next/server'
import { authOptions } from '@/src/features/auth/lib/auth-config'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { getDatabase } from '@/src/lib/database/client'
import { getGitHubAppInstallURL } from '@/src/lib/github/app-auth'
import { Organization, ProviderType, OrganizationType, InstallationStatus } from '@/src/lib/database/models'

export async function GET(request: NextRequest) {
    try {
        // Get authenticated session
        const session = await getServerSession(authOptions)

        // Check if user is authenticated
        if (!session || !session.user?.id) {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'User must be logged in to install GitHub app'
            }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const orgType = searchParams.get('type') || 'personal' // 'personal' or 'organization'
        const orgId = searchParams.get('orgId') // GitHub org ID for organizations

        // Create state parameter with user and organization context
        const stateData = {
            userId: session.user.id,
            orgType,
            orgId: orgId || session.user.id, // Use user ID for personal repos
            timestamp: Date.now()
        }

        const state = Buffer.from(JSON.stringify(stateData)).toString('base64')

        // Check if organization already exists and has active installation
        const existingOrg = await Organization.findOne({
            user_id: session.user.id,
            org_id: orgId || session.user.id,
            provider: ProviderType.GITHUB,
            installation_status: InstallationStatus.ACTIVE
        })

        if (existingOrg) {
            return NextResponse.json({
                error: 'Installation already exists',
                message: 'GitHub app is already installed for this organization',
                installationId: existingOrg.installation_id,
                organizationId: existingOrg._id.toString()
            }, { status: 409 })
        }

        // Generate GitHub App installation URL with state
        const installationUrl = getGitHubAppInstallURL(state)

        return NextResponse.json({
            installUrl: installationUrl,
            state,
            orgType,
            orgId: orgId || session.user.id,
            message: 'Redirect user to GitHub to install the app and select repositories'
        })

    } catch (error) {
        console.error('Error generating GitHub installation URL:', error)
        return NextResponse.json({
            error: 'Internal server error',
            message: 'An unexpected error occurred while generating installation URL',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
