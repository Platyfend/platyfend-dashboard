import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/features/auth/lib/auth-config'
import { githubAppAuth } from '@/src/lib/github/app-auth'
import { Organization, ProviderType, OrganizationType, InstallationStatus } from '@/src/lib/database/models'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const installationId = searchParams.get('installation_id')
        const setupAction = searchParams.get('setup_action')
        const state = searchParams.get('state')

        // Validate required parameters
        if (!installationId) {
            return NextResponse.json({
                error: 'Missing installation_id',
                message: 'GitHub installation ID is required'
            }, { status: 400 })
        }

        if (setupAction !== 'install') {
            return NextResponse.json({
                error: 'Invalid setup action',
                message: 'Only installation setup is supported'
            }, { status: 400 })
        }

        // Parse state parameter
        let stateData: any = {}
        if (state) {
            try {
                stateData = JSON.parse(Buffer.from(state, 'base64').toString())
            } catch (error) {
                console.error('Failed to parse state parameter:', error)
                return NextResponse.json({
                    error: 'Invalid state parameter',
                    message: 'State parameter could not be parsed'
                }, { status: 400 })
            }
        }

        // Get authenticated session
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'User must be logged in'
            }, { status: 401 })
        }

        // Verify state matches current user
        if (stateData.userId && stateData.userId !== session.user.id) {
            return NextResponse.json({
                error: 'State mismatch',
                message: 'Installation state does not match current user'
            }, { status: 403 })
        }

        // Get installation details from GitHub
        const installation = await githubAppAuth.getInstallation(installationId)

        // Get repositories accessible to the installation
        const repositories = await githubAppAuth.getInstallationRepositories(installationId)

        // Determine organization type and details
        const isPersonal = installation.account.type === 'User'
        const orgType = isPersonal ? OrganizationType.PERSONAL : OrganizationType.ORGANIZATION
        const orgId = installation.account.id.toString()
        const orgName = installation.account.login

        // Check if organization already exists
        let organization = await Organization.findOne({
            user_id: session.user.id,
            org_id: orgId,
            provider: ProviderType.GITHUB
        })

        if (organization) {
            // Update existing organization
            organization.installation_id = installationId
            organization.installation_status = InstallationStatus.ACTIVE
            organization.permissions = installation.permissions
            organization.avatar_url = installation.account.avatar_url
            organization.description = installation.account.description || undefined
            organization.public_repos = installation.account.public_repos || 0
            organization.total_repos = repositories.length
            organization.updated_at = new Date()
        } else {
            // Create new organization
            organization = new Organization({
                org_id: orgId,
                user_id: session.user.id,
                provider: ProviderType.GITHUB,
                org_name: orgName,
                org_type: orgType,
                installation_id: installationId,
                installation_status: InstallationStatus.ACTIVE,
                permissions: installation.permissions,
                avatar_url: installation.account.avatar_url,
                description: installation.account.description || undefined,
                public_repos: installation.account.public_repos || 0,
                total_repos: repositories.length,
                repos: [],
                created_at: new Date(),
                updated_at: new Date()
            })
        }

        // Clear existing repositories and add new ones
        // This ensures we have the exact set of repositories from the installation
        organization.repos = repositories.map((repo: any) => ({
            repo_id: repo.id.toString(),
            name: repo.name,
            full_name: repo.full_name,
            private: repo.private,
            installation_id: installationId,
            permissions: repo.permissions ? Object.keys(repo.permissions) : ['read'],
            description: repo.description || undefined,
            language: repo.language || undefined,
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            default_branch: repo.default_branch || 'main',
            url: repo.html_url,
            added_at: new Date(),
            last_sync: new Date()
        }))

        // Update repository counts
        organization.total_repos = repositories.length
        organization.public_repos = repositories.filter((repo: any) => !repo.private).length
        organization.private_repos = repositories.filter((repo: any) => repo.private).length

        await organization.save()

        // Redirect to dashboard with success message
        const redirectUrl = new URL('/dashboard', request.url)
        redirectUrl.searchParams.set('installation', 'success')
        redirectUrl.searchParams.set('org', orgName)
        redirectUrl.searchParams.set('repos', repositories.length.toString())

        return NextResponse.redirect(redirectUrl.toString())

    }catch (error) {
        console.error('GitHub installation callback error:', error)

        // Redirect to dashboard with error message
        const redirectUrl = new URL('/dashboard', request.url)
        redirectUrl.searchParams.set('installation', 'error')
        // Use generic error codes instead of exposing error details
        const errorCode =
            error instanceof Error && error.message.includes('rate limit')
                ? 'rate_limit'
                : 'installation_failed'
        redirectUrl.searchParams.set('error_code', errorCode)

        return NextResponse.redirect(redirectUrl.toString())
    }}