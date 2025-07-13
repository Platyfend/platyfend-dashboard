"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Home, 
  Settings, 
  CreditCard, 
  Users, 
  FileCode, 
  GitFork,
  LogOut,
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
  BookOpen,
  HelpCircle,
  User,
  Lock,
  GitBranch,
  LayoutDashboard,
  BarChart2,
  DollarSign,
  Plug
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { signOut } from "next-auth/react";
import { OrganizationSelector } from "@/src/components/workspace/organization-selector";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail
} from "@/src/components/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb";

// Navigation Items
const navigationItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Repositories", url: "/dashboard/repositories", icon: GitBranch },
  { title: "Dashboard", url: "/dashboard/overview", icon: LayoutDashboard, locked: true },
  { title: "Integrations", url: "/dashboard/integrations", icon: Plug, locked: true },
  { title: "Reports", url: "/dashboard/reports", icon: BarChart2, locked: true },
  { title: "Learnings", url: "/dashboard/learnings", icon: BookOpen },
  { title: "Organization Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Subscription", url: "/dashboard/subscription", icon: DollarSign },
];

const bottomItems = [
  { title: "Docs", url: "/docs", icon: BookOpen },
  { title: "Support", url: "/support", icon: HelpCircle },
];

// Repository List Component
function RepositoryList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const mockRepositories = [
    { name: "platyfend-app" },
  ];

  const filteredRepos = mockRepositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
          <p className="text-slate-600 mt-1">
            List of repositories accessible to Platyfend.
          </p>
        </div>
        <Button className="bg-[#00617b] hover:bg-[#004a5c] text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Repositories
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Repo not found? Search here..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md rounded-lg shadow-sm border-slate-300 focus:border-[#00617b] focus:ring-[#00617b]"
        />
      </div>

      {/* Repository Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-slate-700">
                  <button
                    onClick={handleSort}
                    className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                  >
                    Repository
                    {sortOrder === "asc" ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRepos.map((repo) => (
                <tr
                  key={repo.name}
                  className="border-b border-slate-200 hover:bg-slate-50 group relative transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-900">{repo.name}</div>
                    <button className="absolute right-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded">
                      <Settings className="w-4 h-4 text-slate-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Rows per page</span>
            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="w-20 h-8 bg-white rounded-md shadow-sm border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Page 1 of 1
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={true}
                className="h-8 w-8 p-0 bg-white shadow-sm rounded-md"
              >
                ≪
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={true}
                className="h-8 w-8 p-0 bg-white shadow-sm rounded-md"
              >
                ‹
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={true}
                className="h-8 w-8 p-0 bg-white shadow-sm rounded-md"
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={true}
                className="h-8 w-8 p-0 bg-white shadow-sm rounded-md"
              >
                ≫
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Layout
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Generate breadcrumbs based on current path


  
  const handleSignOut = () => {
    signOut();
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00617b] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        {/* Sidebar */}
        <Sidebar className="shadow-sm border-r border-gray-200 w-64 flex-shrink-0 bg-white">
          <SidebarHeader className="border-b border-gray-200 pb-4 space-y-4">
            <div className="px-2">
              <OrganizationSelector />
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 overflow-y-auto">
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url))}
                        className="w-full justify-start rounded-lg px-3 py-2 text-sm font-medium transition-all text-gray-600 hover:text-gray-800 hover:bg-gray-50 data-[active=true]:bg-[#00617b]/10 data-[active=true]:text-[#00617b] data-[active=true]:font-semibold"
                      >
                        <Link href={item.url} className="flex items-center w-full">
                          <item.icon className="h-4 w-4 mr-3" />
                          <span className="flex-1">{item.title}</span>
                          {item.locked && <Lock className="h-4 w-4 text-gray-400" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Resources */}
            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
                Resources
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {bottomItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className="w-full justify-start rounded-lg px-3 py-2 text-sm font-medium transition-all text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4 mr-3" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                        <AvatarFallback className="rounded-lg">
                          {session?.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-gray-900">{session?.user?.name || "User"}</span>
                        <span className="truncate text-xs text-gray-600">{session?.user?.email || "user@example.com"}</span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                          <AvatarFallback className="rounded-lg">
                            {session?.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold text-gray-900">{session?.user?.name || "User"}</span>
                          <span className="truncate text-xs text-gray-600">{session?.user?.email || "user@example.com"}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="flex items-center text-gray-700 hover:!text-gray-900 hover:!bg-gray-50 cursor-pointer">
                        <User className="mr-2 h-4 w-4 text-gray-500 hover:!text-gray-700" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-gray-700 hover:!text-gray-900 hover:!bg-gray-50 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4 text-gray-500 hover:!text-gray-700" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
          {/* Page Content */}
          <main className="flex-1 p-6 min-w-0 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Export a page component that uses the repository list
export function RepositoriesPage() {
  return <RepositoryList />;
}
