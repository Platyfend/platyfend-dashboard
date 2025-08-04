import { usePathname } from "next/navigation";
import { useOrganizations, type Organization } from "./use-organizations";

export function useCurrentOrganization(): string | null {
  const pathname = usePathname();
  const { data: organizationsData } = useOrganizations();

  // Extract organization ID from URL pattern: /dashboard/[orgId]/...
  const pathSegments = pathname.split('/');

  // If we're on the main dashboard page (/dashboard), return the current organization from MongoDB
  if (pathname === '/dashboard') {
    // Get the current organization from the database data
    const currentOrg = organizationsData?.organizations?.find(org => org.isCurrent);
    return currentOrg?.id || null;
  }

  // If we have a specific orgId in the URL, validate it against the database
  if (pathSegments.length >= 3 && pathSegments[1] === 'dashboard') {
    const urlOrgId = pathSegments[2];

    // Check if this organization exists in the user's organizations from MongoDB
    const orgExists = organizationsData?.organizations?.some(org => org.id === urlOrgId);

    if (orgExists) {
      return urlOrgId;
    }

    // If the URL org doesn't exist, fallback to current organization from database
    const currentOrg = organizationsData?.organizations?.find(org => org.isCurrent);
    return currentOrg?.id || null;
  }

  // Return null if no organization in URL and no current organization
  return null;
}

/**
 * Hook to get the current organization object with all details from MongoDB
 * @returns The current organization object or null if none is found
 */
export function useCurrentOrganizationData(): Organization | null {
  const pathname = usePathname();
  const { data: organizationsData } = useOrganizations();

  // Extract organization ID from URL pattern: /dashboard/[orgId]/...
  const pathSegments = pathname.split('/');

  // If we're on the main dashboard page (/dashboard), return the current organization from MongoDB
  if (pathname === '/dashboard') {
    // Get the current organization from the database data
    return organizationsData?.organizations?.find(org => org.isCurrent) || null;
  }

  // If we have a specific orgId in the URL, validate it against the database
  if (pathSegments.length >= 3 && pathSegments[1] === 'dashboard') {
    const urlOrgId = pathSegments[2];

    // Find the organization by ID from MongoDB data
    const urlOrg = organizationsData?.organizations?.find(org => org.id === urlOrgId);

    if (urlOrg) {
      return urlOrg;
    }

    // If the URL org doesn't exist, fallback to current organization from database
    return organizationsData?.organizations?.find(org => org.isCurrent) || null;
  }

  // Return null if no organization in URL and no current organization
  return null;
}
