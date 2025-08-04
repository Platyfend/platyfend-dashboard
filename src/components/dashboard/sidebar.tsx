"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Settings,
  GitBranch,
  LayoutDashboard,
  BarChart2,
  DollarSign,
  Plug,
  BookOpen,
  HelpCircle,
  Lock,
  Menu
} from "lucide-react";
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
  SidebarTrigger,
} from "@/src/components/ui/sidebar";
import { UserDropdown } from "./user-dropdown";

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

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="shadow-sm border-r border-gray-200 flex-shrink-0 bg-white">
      <SidebarHeader className="border-b border-gray-200 pb-4 space-y-4">
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
        <UserDropdown />
      </SidebarFooter>
    </Sidebar>
  );
}
