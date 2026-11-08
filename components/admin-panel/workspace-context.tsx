"use client";

import { createContext, useContext } from "react";
import type { WorkspaceUser } from "@/types/workspace";

// Presentation only: protected pages and actions still authorize on the server.
export const WorkspaceContext = createContext<WorkspaceUser | null>(null);
export const useWorkspaceUser = () => useContext(WorkspaceContext);
