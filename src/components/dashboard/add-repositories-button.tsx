"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Plus, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { GitHubInstallationError, PermissionError, NetworkError } from "@/src/components/ui/error-boundary";
import { getProviderDisplayName } from "@/src/lib/utils/provider";
import { set } from "mongoose";

interface AddRepositoriesButtonProps {
  organizationId?: string;
  organizationType?: 'personal' | 'organization';
  installationStatus?: 'active' | 'pending' | 'suspended' | 'deleted';
  provider?: string; // VCS provider type
  onInstallationStart?: () => void;
  className?: string;
}

export function AddRepositoriesButton({
  organizationId,
  organizationType = 'personal',
  installationStatus,
  provider = 'github', // Default to GitHub for backward compatibility
  onInstallationStart,
  className
}: AddRepositoriesButtonProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInstallApp = async () => {
    if (!session?.user?.id) {
      setError(`Please sign in to install the ${getProviderDisplayName(provider)} app`);
      return;
    }
    if (!organizationId) {
      setError(`Organization ID is required to install the ${getProviderDisplayName(provider)} app`);
      return;
    }

    setIsLoading(true);
    setError(null);
    onInstallationStart?.();

    if (provider === 'github') {
      try {
        // Create state parameter with organization context
        const stateData = {
          userId: session.user.id,
          orgType: organizationType,
          orgId: organizationId, // This should be the GitHub org/user ID
          orgName: organizationType === 'organization' ? organizationId : session.user.name,
          timestamp: Date.now()
        }

        const state = btoa(JSON.stringify(stateData)) // Base64 encode

        // Direct redirect to GitHub's installation flow with state
        window.location.href = `https://github.com/apps/platyfend-test/installations/new/permissions?target_id=${organizationId}&state=${encodeURIComponent(state)}`;
      } catch (error) {
        console.error(`Error starting ${getProviderDisplayName(provider)} app installation:`, error);
        setError(error instanceof Error ? error.message : 'Failed to start installation');
        setIsLoading(false);
      }
    }
  }

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Redirecting to {getProviderDisplayName(provider)}...
        </>
      );
    }

    switch (installationStatus) {
      case 'active':
        return (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Add Repositories
          </>
        );
      case 'suspended':
        return (
          <>
            <AlertCircle className="w-4 h-4 mr-2" />
            Reactivate {getProviderDisplayName(provider)} App
          </>
        );
      case 'deleted':
        return (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Reinstall {getProviderDisplayName(provider)} App
          </>
        );
      default:
        return (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Add Repositories
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (installationStatus) {
      case 'active':
        return 'outline';
      case 'suspended':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleInstallApp}
        disabled={isLoading}
        variant={getButtonVariant()}
        className={className}
      >
        {getButtonContent()}
        {installationStatus === 'active' && (
          <ExternalLink className="w-4 h-4 ml-2" />
        )}
      </Button>

      {error && (
        <>
          {error.includes('permission') || error.includes('access') ? (
            <PermissionError
              error={error}
              settingsUrl="https://github.com/settings/installations"
              onRetry={() => setError(null)}
            />
          ) : error.includes('network') || error.includes('connection') ? (
            <NetworkError
              error={error}
              onRetry={() => setError(null)}
            />
          ) : error.includes('already installed') ? (
            <GitHubInstallationError
              error={error}
              onRetry={() => setError(null)}
            />
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Installation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Installation status info */}

      {installationStatus === 'suspended' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Suspended</AlertTitle>
          <AlertDescription>
            {getProviderDisplayName(provider)} app access has been suspended. Please reactivate the app to continue
            using repository features.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Simplified version for quick use
export function QuickAddRepositoriesButton({ 
  className,
  organizationId,
  installationStatus 
}: { 
  className?: string;
  organizationId?: string;
  installationStatus?: 'active' | 'pending' | 'suspended' | 'deleted';
}) {
  return (
    <AddRepositoriesButton
      organizationId={organizationId}
      organizationType="personal"
      installationStatus={installationStatus}
      className={className}
    />
  );
}
