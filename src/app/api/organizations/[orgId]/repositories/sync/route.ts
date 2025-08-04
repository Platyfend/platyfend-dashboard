import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/features/auth/lib/auth-config'
import { githubAppAuth } from '@/src/lib/github/app-auth'
import { Organization, ProviderType, InstallationStatus, IRepository } from '@/src/lib/database/models'

// GitHub API repository type
interface GitHubRepository {
    id: number
    name: string
    full_name: string
    private: boolean
    description?: string
    language?: string
    stargazers_count?: number
    forks_count?: number
    default_branch?: string
    html_url: string
    permissions?: Record<string, boolean>
}

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        // Get authenticated session
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'User must be logged in'
            }, { status: 401 })
        }

        const { orgId } = await params

        // Find organization
        const organization = await Organization.findOne({
            org_id: orgId,
            user_id: session.user.id,
            provider: ProviderType.GITHUB,
            installation_status: InstallationStatus.ACTIVE
        })

        if (!organization) {
            return NextResponse.json({
                error: 'Organization not found',
                message: 'Organization not found or not accessible'
            }, { status: 404 })
        }

        // Get current repositories from GitHub
        const repositories: GitHubRepository[] = await githubAppAuth.getInstallationRepositories(organization.installation_id)

        // Get current repo IDs from organization
        const currentRepoIds = new Set<string>(organization.repos.map((repo: IRepository) => repo.repo_id))
        const githubRepoIds = new Set<string>(repositories.map((repo: GitHubRepository) => repo.id.toString()))

        // Find repositories to add and remove
        const reposToAdd = repositories.filter((repo: GitHubRepository) => !currentRepoIds.has(repo.id.toString()))
        const repoIdsToRemove = Array.from(currentRepoIds).filter((repoId: string) => !githubRepoIds.has(repoId))

        let addedCount = 0
        let removedCount = 0
        let updatedCount = 0

        // Remove repositories that are no longer accessible
        for (const repoId of repoIdsToRemove) {
            await organization.removeRepository(repoId)
            removedCount++
        }

        // Add new repositories
        for (const repo of reposToAdd) {
            await organization.addRepository({
                repo_id: repo.id.toString(),
                name: repo.name,
                full_name: repo.full_name,
                private: repo.private,
                installation_id: organization.installation_id,
                permissions: repo.permissions ? Object.keys(repo.permissions) : ['read'],
                description: repo.description || undefined,
                language: repo.language || undefined,
                stars: repo.stargazers_count || 0,
                forks: repo.forks_count || 0,
                default_branch: repo.default_branch || 'main',
                url: repo.html_url
            })
            addedCount++
        }

        // Update existing repositories with latest metadata
        for (const repo of repositories) {
            const repoId = repo.id.toString()
            if (currentRepoIds.has(repoId)) {
                const existingRepo = organization.repos.find((r: IRepository) => r.repo_id === repoId)
                if (existingRepo) {
                    // Update repository metadata
                    existingRepo.name = repo.name
                    existingRepo.full_name = repo.full_name
                    existingRepo.private = repo.private
                    existingRepo.description = repo.description || undefined
                    existingRepo.language = repo.language || undefined
                    existingRepo.stars = repo.stargazers_count || 0
                    existingRepo.forks = repo.forks_count || 0
                    existingRepo.default_branch = repo.default_branch || 'main'
                    existingRepo.url = repo.html_url
                    existingRepo.last_sync = new Date()
                    updatedCount++
                }
            }
        }

        // Update organization metadata
        organization.total_repos = repositories.length
        organization.public_repos = repositories.filter((repo: GitHubRepository) => !repo.private).length
        organization.private_repos = repositories.filter((repo: GitHubRepository) => repo.private).length
        organization.updated_at = new Date()

        await organization.save()

        return NextResponse.json({
            success: true,
            message: 'Repository synchronization completed',
            summary: {
                total: repositories.length,
                added: addedCount,
                removed: removedCount,
                updated: updatedCount
            },
            organization: {
                id: organization._id.toString(),
                name: organization.org_name,
                totalRepos: organization.total_repos,
                publicRepos: organization.public_repos,
                privateRepos: organization.private_repos
            }
        })

    } catch (error) {
        console.error('Repository sync error:', error)
        return NextResponse.json({
            error: 'Sync failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred during sync'
        }, { status: 500 })
    }
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        // Get authenticated session
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'User must be logged in'
            }, { status: 401 })
        }

        const { orgId } = await params

        // Find organization
        const organization = await Organization.findOne({
            org_id: orgId,
            user_id: session.user.id,
            provider: ProviderType.GITHUB
        })

        if (!organization) {
            return NextResponse.json({
                error: 'Organization not found',
                message: 'Organization not found or not accessible'
            }, { status: 404 })
        }

        // Return current sync status
        return NextResponse.json({
            organization: {
                id: organization._id.toString(),
                name: organization.org_name,
                type: organization.org_type,
                installationStatus: organization.installation_status,
                totalRepos: organization.total_repos,
                publicRepos: organization.public_repos,
                privateRepos: organization.private_repos,
                lastUpdated: organization.updated_at
            },
            repositories: organization.repos.map((repo: IRepository) => ({
                id: repo.repo_id,
                name: repo.name,
                fullName: repo.full_name,
                private: repo.private,
                language: repo.language,
                stars: repo.stars,
                forks: repo.forks,
                lastSync: repo.last_sync,
                addedAt: repo.added_at
            })),
            syncInfo: {
                canSync: organization.installation_status === InstallationStatus.ACTIVE,
                lastSync: organization.updated_at,
                repositoryCount: organization.repos.length
            }
        })

    } catch (error) {
        console.error('Get sync status error:', error)
        return NextResponse.json({
            error: 'Failed to get sync status',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
