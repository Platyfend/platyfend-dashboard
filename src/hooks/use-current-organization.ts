import { usePathname } from "next/navigation";

export function useCurrentOrganization(): string | null {
  const pathname = usePathname();

  // Extract organization ID from URL pattern: /dashboard/[orgId]/...
  const pathSegments = pathname.split('/');

  // If we're on the main dashboard page (/dashboard), return null
  if (pathname === '/dashboard') {
    return null;
  }

  if (pathSegments.length >= 3 && pathSegments[1] === 'dashboard') {
    return pathSegments[2]; // This is the orgId
  }

  // Return null if no organization in URL
  return null;
}
