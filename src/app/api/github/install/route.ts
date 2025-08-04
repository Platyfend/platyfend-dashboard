import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/features/auth/lib/auth-config'
import { getDatabase } from '@/src/lib/database/client'
import { Organization, ProviderType, OrganizationType, InstallationStatus, IRepository, Account } from '@/src/lib/database/models'
import { githubAppAuth } from '@/src/lib/github/app-auth'

export async function GET(request: NextRequest) {
    try {
        // Get authenticated session
        const session = await getServerSession(authOptions)

        // Check if user is authenticated
        if (!session || !session.user?.id) {
            // Redirect to login if not authenticated
            return NextResponse.redirect(new URL('/auth/signin', request.url))
        }

        const { searchParams } = new URL(request.url)
        const installationId = searchParams.get('installation_id')
        const setupAction = searchParams.get('setup_action')
        const state = searchParams.get('state')

        // Validate required parameters
        if (!installationId) {
            console.error('Missing installation_id in GitHub callback')
            return NextResponse.redirect(new URL('/dashboard?error=missing_installation_id', request.url))
        }

        if (setupAction !== 'install') {
            console.error('Invalid setup_action:', setupAction)
            return NextResponse.redirect(new URL('/dashboard?error=invalid_setup_action', request.url))
        }

        // Parse state if provided (contains user context)
        let stateData = null
        if (state) {
            try {
                stateData = JSON.parse(Buffer.from(state, 'base64').toString())
            } catch (error) {
                console.error('Error parsing state parameter:', error)
            }
        }

        try {
            // Connect to database
            await getDatabase()

            // If orgId is missing from state, get GitHub user ID from Account
            let githubOrgId = stateData?.orgId
            let orgName = stateData?.orgName
            let orgType = stateData?.orgType as OrganizationType

            if (!githubOrgId) {
                // Get GitHub user ID from Account collection
                const githubAccount = await Account.findOne({
                    userId: session.user.id,
                    provider: 'github'
                })

                if (githubAccount) {
                    githubOrgId = githubAccount.providerAccountId // This is the GitHub user ID
                    orgName = session.user.name || 'Personal'
                    orgType = OrganizationType.PERSONAL
                } else {
                    throw new Error('No GitHub account found for user')
                }
            }

            // Create or update organization record
            const organizationData = {
                user_id: session.user.id,
                org_name: orgName,
                org_id: githubOrgId,
                org_type: orgType || OrganizationType.PERSONAL,
                provider: ProviderType.GITHUB,
                installation_id: installationId,
                installation_status: InstallationStatus.ACTIVE,
                permissions: {
                    metadata: 'read',
                    contents: 'read',
                    pull_requests: 'write',
                    issues: 'write'
                },
                created_at: new Date(),
                updated_at: new Date()
            }

            // Upsert organization (update if exists, create if not)
            const organization = await Organization.findOneAndUpdate(
                {
                    user_id: session.user.id,
                    org_id: githubOrgId,
                    provider: ProviderType.GITHUB
                },
                organizationData,
                {
                    upsert: true,
                    new: true
                }
            )

            if (!organization) {
                throw new Error('Failed to create or update organization')
            }

            // Fetch repositories from GitHub and add them to the organization
            try {
                const repositories = await githubAppAuth.getInstallationRepositories(installationId)

                // Transform GitHub repositories to our format
                const currentTime = new Date()
                const repoData: IRepository[] = repositories.map((repo: any) => {
                    // Map GitHub permissions to our allowed permissions
                    const githubPerms = repo.permissions || {}
                    const mappedPermissions: string[] = []

                    if (githubPerms.admin) mappedPermissions.push('admin')
                    else if (githubPerms.push) mappedPermissions.push('write')
                    else mappedPermissions.push('read')

                    if (githubPerms.pull) mappedPermissions.push('pull_requests')
                    if (githubPerms.issues) mappedPermissions.push('issues')
                    mappedPermissions.push('metadata') // Always include metadata

                    return {
                        repo_id: repo.id.toString(),
                        name: repo.name,
                        full_name: repo.full_name,
                        private: repo.private,
                        installation_id: installationId,
                        permissions: [...new Set(mappedPermissions)], // Remove duplicates
                        description: repo.description || undefined,
                        language: repo.language || undefined,
                        stars: repo.stargazers_count || 0,
                        forks: repo.forks_count || 0,
                        default_branch: repo.default_branch || 'main',
                        url: repo.html_url,
                        added_at: currentTime,
                        last_sync: currentTime
                    }
                })

                // Update organization with repositories using simple update
                await Organization.findByIdAndUpdate(
                    organization._id,
                    {
                        $set: {
                            repos: repoData,
                            total_repos: repoData.length,
                            public_repos: repoData.filter(repo => !repo.private).length,
                            private_repos: repoData.filter(repo => repo.private).length,
                            updated_at: currentTime
                        }
                    },
                    { new: true, runValidators: true }
                )

                console.log('GitHub App installation completed successfully:', {
                    userId: session.user.id,
                    installationId,
                    orgId: stateData?.orgId,
                    repositoriesAdded: repoData.length
                })

            } catch (repoError) {
                console.error('Error fetching repositories during installation:', repoError)
                // Don't fail the installation if repository fetching fails
                // The repositories can be synced later
                console.log('GitHub App installation completed (repositories will be synced later):', {
                    userId: session.user.id,
                    installationId,
                    orgId: stateData?.orgId
                })
            }

            // Redirect back to dashboard with success message
            return NextResponse.redirect(new URL('/dashboard?installation=success', request.url))

        } catch (dbError) {
            console.error('Database error during GitHub installation:', dbError)
            return NextResponse.redirect(new URL('/dashboard?error=database_error', request.url))
        }

    } catch (error) {
        console.error('Error handling GitHub App installation callback:', error)
        return NextResponse.redirect(new URL('/dashboard?error=installation_failed', request.url))
    }
}
