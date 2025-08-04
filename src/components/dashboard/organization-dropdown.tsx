"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, GitBranch, RefreshCw, ExternalLink } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useOrganizations } from "@/src/hooks/use-organizations";

export function OrganizationDropdown() {
  const router = useRouter();
  const { data: organizationsData, isLoading, error } = useOrganizations();

  const organizations = organizationsData?.organizations || [];
  const currentOrg = organizations.find(org => org.isCurrent) || organizations[0];

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full p-3 flex items-center space-x-3">
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex flex-col space-y-1">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full p-3 flex items-center space-x-3">
        <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
          <ExternalLink className="h-4 w-4 text-red-500" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-red-900 text-sm">Error loading organizations</span>
          <span className="text-xs text-red-600">Click to retry</span>
        </div>
      </div>
    );
  }

  const getProviderIcon = (provider: 'github' | 'gitlab') => {
    switch (provider) {
      case 'github':
        return <GitBranch className="h-4 w-4" />;
      case 'gitlab':
        return <GitBranch className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleExpandAccess = () => {
    // This would redirect to OAuth to expand permissions
    console.log('Expanding OAuth access...');
  };

  const handleOrganizationSelect = (orgId: string) => {
    // Navigate to the organization-specific repositories page
    router.push(`/dashboard/${orgId}/repositories`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto p-3 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentOrg?.avatar || ""} alt={currentOrg?.name || ""} />
              <AvatarFallback className="bg-gray-100">
                {getProviderIcon(currentOrg?.provider || 'github')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="font-medium text-gray-900 text-sm">
                {currentOrg?.name || 'Select Organization'}
              </span>
              <span className="text-xs text-gray-500">Change Organization</span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        className="w-80 p-0"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        {/* Organizations Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Organizations</h3>
            <div className="flex items-center space-x-1">
              <RefreshCw className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Synced</span>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        <div className="py-2">
          {organizations.length > 0 ? (
            organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                className="px-4 py-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                onClick={() => handleOrganizationSelect(org.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={org.avatar || ""} alt={org.name} />
                      <AvatarFallback className="bg-gray-100 text-xs">
                        {getProviderIcon(org.provider)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-900">{org.name}</span>
                  </div>
                  {org.isCurrent && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-100">
                      Current
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500 mb-2">No organizations found</p>
              <p className="text-xs text-gray-400">Connect your GitHub or GitLab account to see organizations</p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Can't find organization section */}
        <div className="px-4 py-3">
          <p className="text-sm text-gray-600 mb-2">Can't find an organization?</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-sm"
            onClick={handleExpandAccess}
          >
            <span>Check Permissions</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
