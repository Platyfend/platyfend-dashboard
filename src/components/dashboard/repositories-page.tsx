"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { useOrganizationRepos, useOrganizationRepoSync, useUserOrganizations, organizationNeedsInstallation } from "@/src/hooks/use-organization-repos";
import { LoadingSpinner } from "@/src/components/dashboard/loading-spinner";
import { AddRepositoriesButton } from "@/src/components/dashboard/add-repositories-button";
import { RepositoryList } from "@/src/components/dashboard/repository-list";
import { getProviderDisplayName } from "@/src/lib/utils/provider";
import { toInstallationStatus } from "@/src/lib/utils/installation-status";

// Main Repositories Page Component
interface RepositoriesPageProps {
  organizationId: string;
}

export function RepositoriesPage({ organizationId }: RepositoriesPageProps) {
  const { data: repositoriesData, isLoading, error } = useOrganizationRepos(organizationId);
  const { mutate: syncRepositories, isPending: isSyncing } = useOrganizationRepoSync(organizationId);
  const { organizations } = useUserOrganizations();

  const currentOrg = organizations.find(org => org.id === organizationId);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
          <p className="text-slate-600 mt-1">Loading repositories...</p>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  // Handle error states
  if (error) {
    if (error.requiresInstallation || organizationNeedsInstallation(currentOrg?.installationStatus)) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
            <p className="text-slate-600 mt-1">
              Install the {getProviderDisplayName(currentOrg?.provider)} app to access repositories.
            </p>
          </div>
          <AddRepositoriesButton
            organizationId={organizationId}
            installationStatus={toInstallationStatus(currentOrg?.installationStatus)}
            provider={currentOrg?.provider}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
          <p className="text-slate-600 mt-1">Error loading repositories</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
          <p className="text-slate-600 mt-1">
            Manage repositories for {currentOrg?.name || 'your organization'}
          </p>
        </div>
        <AddRepositoriesButton
          organizationId={organizationId}
          installationStatus={toInstallationStatus(currentOrg?.installationStatus)}
          provider={currentOrg?.provider}
        />
      </div>

      <RepositoryList
        repositories={repositoriesData?.repositories || []}
        organizationName={currentOrg?.name || 'Organization'}
        provider={currentOrg?.provider}
        isLoading={isSyncing}
        onRefresh={() => syncRepositories()}
      />
    </div>
  );
}
