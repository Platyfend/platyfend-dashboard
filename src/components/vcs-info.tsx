"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { RefreshCw, GitBranch, Lock, Unlock } from 'lucide-react'

interface VCSInfo {
  user: {
    id: string
    name: string
    email: string
  }
  vcs: {
    github: {
      id: string
      accountId: string
      accountLogin: string
      hasAccessToken: boolean
      tokenExpiresAt: string | null
      repositoryCount: number
      repositories: Array<{
        id: string
        name: string
        fullName: string
        private: boolean
        defaultBranch: string
      }>
    } | null
  }
}

export function VCSInfo() {
  const { data: session, status } = useSession()
  const [vcsInfo, setVcsInfo] = useState<VCSInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchVCSInfo = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/vcs/info')
      if (response.ok) {
        const data = await response.json()
        setVcsInfo(data)
      }
    } catch (error) {
      console.error('Error fetching VCS info:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshRepositories = async () => {
    if (!session) return
    
    setRefreshing(true)
    try {
      const response = await fetch('/api/vcs/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'github' })
      })
      
      if (response.ok) {
        // Refresh the VCS info after successful refresh
        await fetchVCSInfo()
      }
    } catch (error) {
      console.error('Error refreshing repositories:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchVCSInfo()
    }
  }, [session])

  if (status === 'loading') {
    return <div>Loading session...</div>
  }

  if (!session) {
    return <div>Please sign in to view VCS information</div>
  }

  if (loading) {
    return <div>Loading VCS information...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Your GitHub OAuth information and repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vcsInfo?.vcs.github ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Account</p>
                  <p className="text-sm text-muted-foreground">@{vcsInfo.vcs.github.accountLogin}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Access Token</p>
                  <Badge variant={vcsInfo.vcs.github.hasAccessToken ? "default" : "destructive"}>
                    {vcsInfo.vcs.github.hasAccessToken ? "Available" : "Missing"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Repositories</p>
                  <p className="text-sm text-muted-foreground">{vcsInfo.vcs.github.repositoryCount} found</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Token Expires</p>
                  <p className="text-sm text-muted-foreground">
                    {vcsInfo.vcs.github.tokenExpiresAt 
                      ? new Date(vcsInfo.vcs.github.tokenExpiresAt).toLocaleDateString()
                      : "No expiration"
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={refreshRepositories} 
                  disabled={refreshing}
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh Repositories'}
                </Button>
              </div>

              {vcsInfo.vcs.github.repositories.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Repositories</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {vcsInfo.vcs.github.repositories.map((repo) => (
                      <div key={repo.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{repo.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            Default branch: {repo.defaultBranch}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {repo.private ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Unlock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Badge variant={repo.private ? "secondary" : "outline"}>
                            {repo.private ? "Private" : "Public"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No GitHub integration found. Please sign in with GitHub to connect your account.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
