"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"

import { MessageSquare, Settings, Users, BarChart3 } from "lucide-react"
import { useCurrentOrganization } from "@/src/hooks/use-current-organization"
import { useRepositoryStats, useCurrentOrganizationRepos, useUserOrganizations } from "@/src/hooks/use-organization-repos"
import { AddRepositoriesButton } from "@/src/components/dashboard/add-repositories-button"
import { RepositoryCard } from "@/src/components/dashboard/repository-list"
import { getProviderDisplayName } from "@/src/lib/utils/provider"

export function DashboardPage() {
  const router = useRouter()
  const currentOrgId = useCurrentOrganization()
  const { currentOrganization } = useUserOrganizations()
  const repositoryStats = useRepositoryStats()
  const { data: orgReposData, isLoading: isLoadingRepos } = useCurrentOrganizationRepos()

  const stats = {
    totalRepositories: repositoryStats.totalRepos,
    activeReviews: 0,
    completedReviews: 0,
    activeInstallations: repositoryStats.activeInstallations,
    pendingInstallations: repositoryStats.pendingInstallations
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Welcome to Platyfend - your AI-powered code review platform.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-gray-200 bg-white hover:border-[#00617b]/30 hover:shadow-[#00617b]/10"
          onClick={() => router.push(currentOrgId ? `/dashboard/${currentOrgId}/repositories` : "/dashboard/personal/repositories")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Repositories</CardTitle>
            <MessageSquare className="h-4 w-4 text-[#00617b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.totalRepositories}</div>
            <p className="text-xs text-gray-400 cursor-pointer ">
              Connected repositories
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-gray-200 bg-white hover:border-[#00617b]/30 hover:shadow-[#00617b]/10"
          onClick={() => router.push("/dashboard/reports")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reports</CardTitle>
            <Users className="h-4 w-4 text-[#00617b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats.activeReviews}</div>
            <p className="text-xs text-gray-400 cursor-pointer">
              View reports
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-gray-200 bg-white hover:border-[#00617b]/30 hover:shadow-[#00617b]/10"
          onClick={() => router.push("/dashboard/profile")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Profile</CardTitle>
            <BarChart3 className="h-4 w-4 text-[#00617b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">1</div>
            <p className="text-xs text-gray-400 cursor-pointer">
              User profile
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-gray-200 bg-white hover:border-[#00617b]/30 hover:shadow-[#00617b]/10"
          onClick={() => router.push("/dashboard/settings")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Settings</CardTitle>
            <Settings className="h-4 w-4 text-[#00617b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">Config</div>
            <p className="text-xs text-gray-400 cursor-pointer">
              Account settings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">Recent Repositories</CardTitle>
            <CardDescription className="text-gray-500">
              Your recently connected repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRepos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00617b] mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading repositories...</p>
              </div>
            ) : orgReposData?.repositories && orgReposData.repositories.length > 0 ? (
              <div className="space-y-4">
                {orgReposData.repositories.slice(0, 3).map((repo) => (
                  <RepositoryCard
                    key={repo.id}
                    repository={repo}
                    onClick={(repo) => router.push(`/dashboard/repository/${repo.id}`)}
                  />
                ))}
                {orgReposData.repositories.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-gray-300 text-gray-600 hover:bg-gray-50"
                    onClick={() => router.push(currentOrgId ? `/dashboard/${currentOrgId}/repositories` : "/dashboard/personal/repositories")}
                  >
                    View All Repositories ({orgReposData.repositories.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-700 font-medium">No repositories yet</p>
                <p className="text-sm text-gray-400 mt-1">Install the {getProviderDisplayName(currentOrganization?.provider)} app to connect repositories</p>
                <AddRepositoriesButton
                  organizationId={currentOrganization?.id}
                  installationStatus={orgReposData?.organization?.installationStatus as any}
                  provider={currentOrganization?.provider}
                  className="mt-4 bg-[#00617b] hover:bg-[#004a5c] text-white shadow-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
