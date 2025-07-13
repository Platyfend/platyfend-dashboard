"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"

// Import types from the workspace plan hook
export interface WorkspacePlan {
  planId: string
  plan: {
    id: string
    name: string
    description: string
    price: number
    features: {
      maxAgents: number | 'unlimited'
      monthlyCredits: number
      maxLinks: number | 'unlimited'
    }
    allowedModels: string[]
  }
}

export interface WorkspaceBilling {
  billing: {
    planId: string
    plan: WorkspacePlan['plan']
    creditsUsed: number
    creditsRemaining: number
    subscriptionStatus: string
    currentPeriodStart: string
    currentPeriodEnd: string
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
  }
  limits: {
    chatbots: {
      current: number
      limit: number | 'unlimited'
      canCreate: boolean
    }
    links: {
      current: number
      limit: number | 'unlimited'
      canCreate: boolean
    }
  }
  creditStats: {
    dailyUsage: Array<{
      date: string
      credits: number
    }>
    totalUsage: number
    averageDaily: number
  }
}

export interface Workspace {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  source?: "manual" | "github" | "gitlab"
  createdAt: string
  updatedAt: string
  members?: Array<{
    id: string
    userId: string
    workspaceId: string
    role: "owner" | "admin" | "member" | "viewer"
    user: {
      id: string
      name?: string
      email: string
      image?: string
    }
  }>
  installations?: Array<{
    id: string
    userId: string
    providerId: string
    installationId: string
    accountId: string
    accountLogin: string
    tokenExpiresAt: Date | null
  }>
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  workspacePlan: WorkspacePlan | null
  billingInfo: WorkspaceBilling | null
  isLoading: boolean
  isPlanLoading: boolean
  error: string | null
  planError: string | null

  // Actions
  fetchWorkspaces: () => Promise<void>
  setCurrentWorkspace: (workspace: Workspace | null) => boolean
  createWorkspace: (data: { name: string; description?: string }) => Promise<Workspace>
  updateWorkspace: (id: string, data: { name?: string; description?: string }) => Promise<Workspace>
  deleteWorkspace: (id: string) => Promise<void>
  refreshCurrentWorkspace: () => Promise<void>
  refreshWorkspacePlan: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null)
  const [workspacePlan, setWorkspacePlan] = useState<WorkspacePlan | null>(null)
  const [billingInfo, setBillingInfo] = useState<WorkspaceBilling | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlanLoading, setIsPlanLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)

  // Ref to track if workspace creation is already in progress to prevent concurrent calls
  const isCreatingWorkspaceRef = useRef(false)

  // Create default workspace for new users (similar to registration)
  const createDefaultWorkspace = useCallback(async (): Promise<Workspace> => {
    if (!session?.user?.id || !session?.user?.email) {
      throw new Error("User session not available")
    }

    const userName = session.user.name || session.user.email.split('@')[0]

    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${userName}'s Workspace`,
        description: "Your personal workspace",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create default workspace")
    }

    return await response.json()
  }, [session?.user?.id, session?.user?.email, session?.user?.name])

  // Sync GitHub organizations as workspaces
  const syncGitHubOrganizations = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch("/api/workspaces/sync-github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        console.log("✅ GitHub organizations synced successfully")
      } else {
        console.log("ℹ️ GitHub sync not available or failed")
      }
    } catch (error) {
      console.log("ℹ️ GitHub sync not available:", error)
      // Don't throw error - this is optional functionality
    }
  }, [session?.user?.id])

  // Fetch workspaces from API
  const fetchWorkspaces = useCallback(async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      // First, try to sync GitHub organizations as workspaces
      await syncGitHubOrganizations()

      const response = await fetch("/api/workspaces")
      if (!response.ok) {
        throw new Error("Failed to fetch workspaces")
      }

      const data = await response.json()

      // If no workspaces exist after GitHub sync, create a default one
      if (data.length === 0) {
        // Check if workspace creation is already in progress to prevent concurrent calls
        if (isCreatingWorkspaceRef.current) {
          console.log("Workspace creation already in progress, skipping...")
          return
        }

        try {
          isCreatingWorkspaceRef.current = true
          console.log("No workspaces found after GitHub sync, creating default workspace...")
          const defaultWorkspace = await createDefaultWorkspace()
          setWorkspaces([defaultWorkspace])
          setCurrentWorkspaceState(defaultWorkspace)
          // Fetch plan data for the new workspace
          fetchWorkspacePlan(defaultWorkspace.id)
          console.log("✅ Default workspace created successfully")
          return
        } catch (createError) {
          console.error("❌ Failed to create default workspace:", createError)
          // Continue with empty workspaces if creation fails
          setWorkspaces([])
          setError("No workspaces found. Please create a workspace to continue.")
          return
        } finally {
          isCreatingWorkspaceRef.current = false
        }
      }

      setWorkspaces(data)

      // Set current workspace if none selected and workspaces exist
      // Only do this during initial load, not when currentWorkspace changes
      setCurrentWorkspaceState(prevCurrentWorkspace => {
        if (!prevCurrentWorkspace && data.length > 0) {
          const savedWorkspaceId = localStorage.getItem("currentWorkspaceId")
          const savedWorkspace = savedWorkspaceId
            ? data.find((w: Workspace) => w.id === savedWorkspaceId)
            : null

          const workspaceToSet = savedWorkspace || data[0]
          // Fetch plan data for the initial workspace
          fetchWorkspacePlan(workspaceToSet.id)
          return workspaceToSet
        }
        return prevCurrentWorkspace
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, createDefaultWorkspace])

  // Fetch workspace plan information
  const fetchWorkspacePlan = async (workspaceId: string) => {
    setIsPlanLoading(true)
    setPlanError(null)

    try {
      const response = await fetch(`/api/billing/info?workspaceId=${workspaceId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch workspace plan: ${response.status}`)
      }

      const data: WorkspaceBilling = await response.json()

      setBillingInfo(data)
      setWorkspacePlan({
        planId: data.billing.planId,
        plan: data.billing.plan
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workspace plan'
      setPlanError(errorMessage)
      console.error("Error fetching workspace plan:", err)
    } finally {
      setIsPlanLoading(false)
    }
  }

  // Internal function to set current workspace without triggering navigation
  const setCurrentWorkspaceInternal = (workspace: Workspace | null): boolean => {
    try {
      setCurrentWorkspaceState(workspace)
      if (workspace) {
        localStorage.setItem("currentWorkspaceId", workspace.id)
        // Fetch plan data for the new workspace
        fetchWorkspacePlan(workspace.id)
      } else {
        localStorage.removeItem("currentWorkspaceId")
        // Clear plan data when no workspace is selected
        setWorkspacePlan(null)
        setBillingInfo(null)
        setPlanError(null)
      }
      return true
    } catch (error) {
      console.error("Failed to set current workspace:", error)
      return false
    }
  }

  // Set current workspace and save to localStorage (for external use)
  const setCurrentWorkspace = (workspace: Workspace | null): boolean => {
    return setCurrentWorkspaceInternal(workspace)
  }

  // Create new workspace
  const createWorkspace = async (data: { name: string; description?: string }): Promise<Workspace> => {
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create workspace")
    }

    const newWorkspace = await response.json()
    setWorkspaces(prev => [newWorkspace, ...prev])

    // Set as current workspace if it's the first one
    if (workspaces.length === 0) {
      setCurrentWorkspaceInternal(newWorkspace)
    }

    return newWorkspace
  }

  // Update workspace
  const updateWorkspace = async (id: string, data: { name?: string; description?: string }): Promise<Workspace> => {
    const response = await fetch(`/api/workspaces/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to update workspace")
    }

    const updatedWorkspace = await response.json()

    setWorkspaces(prev =>
      prev.map(w => w.id === id ? updatedWorkspace : w)
    )

    // Update current workspace if it's the one being updated
    if (currentWorkspace?.id === id) {
      setCurrentWorkspaceState(updatedWorkspace)
    }

    return updatedWorkspace
  }

  // Delete workspace
  const deleteWorkspace = async (id: string): Promise<void> => {
    const response = await fetch(`/api/workspaces/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to delete workspace")
    }

    setWorkspaces(prev => prev.filter(w => w.id !== id))

    // If deleted workspace was current, switch to another one
    if (currentWorkspace?.id === id) {
      const remainingWorkspaces = workspaces.filter(w => w.id !== id)
      setCurrentWorkspaceInternal(remainingWorkspaces.length > 0 ? remainingWorkspaces[0] : null)
    }
  }

  // Refresh workspace plan data
  const refreshWorkspacePlan = async () => {
    if (!currentWorkspace) return
    await fetchWorkspacePlan(currentWorkspace.id)
  }

  // Refresh current workspace data
  const refreshCurrentWorkspace = async () => {
    if (!currentWorkspace) return

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}`)
      if (response.ok) {
        const updatedWorkspace = await response.json()
        setCurrentWorkspaceState(updatedWorkspace)

        // Also update in workspaces list
        setWorkspaces(prev =>
          prev.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w)
        )

        // Also refresh plan data
        await fetchWorkspacePlan(updatedWorkspace.id)
      }
    } catch (err) {
      console.error("Failed to refresh workspace:", err)
    }
  }

  // Fetch workspaces when user session is available
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchWorkspaces()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id]) // Intentionally omitting fetchWorkspaces to prevent circular dependency

  const value: WorkspaceContextType = {
    workspaces,
    currentWorkspace,
    workspacePlan,
    billingInfo,
    isLoading,
    isPlanLoading,
    error,
    planError,
    fetchWorkspaces,
    setCurrentWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    refreshCurrentWorkspace,
    refreshWorkspacePlan,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}
