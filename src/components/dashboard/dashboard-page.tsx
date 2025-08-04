"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar"
import { MessageSquare, Settings, Users, BarChart3 } from "lucide-react"

export function DashboardPage() {
  const repositories: any[] = []
  const stats = {
    totalRepositories: repositories.length,
    activeReviews: 0,
    completedReviews: 0
  }
  const router = useRouter()

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
          onClick={() => router.push("/dashboard/personal/repositories")}
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
            {repositories.length > 0 ? (
              <div className="space-y-4">
                {repositories.slice(0, 3).map((repo) => (
                  <div
                    key={repo.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors space-y-2 sm:space-y-0"
                    onClick={() => router.push(`/dashboard/repositories/${repo.id}`)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                        <AvatarFallback className="bg-[#00617b]/10 text-[#00617b] text-sm">
                          {repo.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base text-gray-800 truncate">{repo.name}</p>
                        <p className="text-xs sm:text-sm text-gray-400">
                          {repo.reviews || 0} reviews
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                        {repo.language || "JavaScript"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {repositories.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-gray-300 text-gray-600 hover:bg-gray-50"
                    onClick={() => router.push("/dashboard/personal/repositories")}
                  >
                    View All Repositories ({repositories.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-700 font-medium">No repositories yet</p>
                <p className="text-sm text-gray-400 mt-1">Connect your first repository to get started</p>
                <Button
                  className="mt-4 bg-[#00617b] hover:bg-[#004a5c] text-white shadow-sm cursor-pointer"
                  onClick={() => router.push("/dashboard/personal/repositories")}
                >
                  Connect Repository
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
