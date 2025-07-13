"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Building2, Lock } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";

import { useWorkspace } from "@/src/contexts/workspace-context";
import type { Workspace } from "@/src/contexts/workspace-context";

interface OrganizationSelectorProps {
  className?: string;
}

export function OrganizationSelector({}: OrganizationSelectorProps) {
  const [open, setOpen] = useState(false);
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();

  const handleSelect = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setOpen(false);
  };


  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#00617b] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-gray-800 py-2 w-full hover:bg-gray-50 h-14 cursor-default px-2 text-start"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="organization-selector"
            data-state={open ? "open" : "closed"}
          >
            {/* GitHub Icon */}
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              role="img"
              viewBox="0 0 24 24"
              className="rounded-full shrink-0 text-gray-700"
              height="36"
              width="36"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
            </svg>

            <div className="flex grow items-center overflow-hidden">
              <div className="ml-3 min-w-0 flex-1">
                <div className="font-500 text-gray-800 truncate text-lg">
                  {currentWorkspace?.name}
                </div>
                <div className="text-gray-500 -mt-1 text-sm">
                  Change Organization
                </div>
              </div>

              {/* Chevron Icon */}
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-4 shrink-0 text-gray-400"
                height="20"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m7 15 5 5 5-5"></path>
                <path d="m7 9 5-5 5 5"></path>
              </svg>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="bg-white text-gray-800 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-72 rounded-md border border-gray-200 shadow-lg outline-hidden z-20 p-0"
          align="start"
          side="right"
        >
          <div className="py-2">
            <div className="px-4">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-semibold text-gray-800">Organizations</h1>
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 512 512"
                  className="text-gray-400 hover:cursor-pointer hover:text-[#00617b] transition-colors"
                  height="18"
                  width="18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M256 388c-72.597 0-132-59.405-132-132 0-72.601 59.403-132 132-132 36.3 0 69.299 15.4 92.406 39.601L278 234h154V80l-51.698 51.702C348.406 99.798 304.406 80 256 80c-96.797 0-176 79.203-176 176s78.094 176 176 176c81.045 0 148.287-54.134 169.401-128H378.85c-18.745 49.561-67.138 84-122.85 84z"></path>
                </svg>
              </div>
              <p className="text-xs text-green-600 font-medium">Synced</p>
            </div>
            <hr className="my-2.5 border-gray-200" />
            <ul className="scrollbar-thin max-h-44 overflow-y-auto text-sm" aria-labelledby="dropdownLargeButton">
              {workspaces.map((workspace) => (
                <li
                  key={workspace.id}
                  className="block px-4 py-2 hover:cursor-pointer hover:bg-gray-50 text-gray-700 hover:text-gray-800 transition-colors"
                  onClick={() => handleSelect(workspace)}
                >
                  {workspace.name}
                  {currentWorkspace?.id === workspace.id && (
                    <span className="bg-[#00617b] ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium text-white">
                      Current
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="block border-t border-gray-200 px-4 py-2 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700">Can't find an organization?</h4>
            <a
              className="group text-gray-500 hover:text-[#00617b] mt-1 flex items-center gap-1 text-xs transition-colors"
              target="_blank"
              href="https://github.com/settings/connections/applications/45872a44c0e55c462eed"
              rel="noreferrer"
            >
              Check Permissions
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 448 512"
                className="transition-all group-hover:ml-0.5"
                height="10"
                width="10"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"></path>
              </svg>
            </a>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
