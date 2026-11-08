import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid
} from "lucide-react";
import { IconBook2, IconClipboardCheck, IconFileText, IconLayoutDashboard, IconSchool, IconShieldCheck, IconUsers } from "@tabler/icons-react";
import type { ComponentType } from "react";
import type { WorkspaceRole } from "@/types/workspace";

export type NavigationIcon = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

export type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

export type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: NavigationIcon;
  submenus?: Submenu[];
};

export type Group = {
  groupLabel: string;
  menus: Menu[];
};

export const workspaceRoleLabels: Record<WorkspaceRole, string> = {
  superadmin: "Superadmin",
  exam_controller: "Exam controller",
  faculty: "Faculty",
  reviewer: "Reviewer",
  paper_setter: "Paper setter",
};

const roleNavigation: Record<WorkspaceRole, Group> = {
  superadmin: { groupLabel: "Superadmin", menus: [
    { href: "/dashboard", label: "Administration", icon: IconShieldCheck },
    { href: "/dashboard/users", label: "Users", icon: IconUsers },
  ] },
  exam_controller: { groupLabel: "Exam controller", menus: [
    { href: "/dashboard", label: "Examination workspace", icon: IconBook2 },
    { href: "/dashboard/users", label: "Users", icon: IconUsers },
    { href: "/dashboard/assignments", label: "Assignments", icon: IconClipboardCheck },
    { href: "/dashboard/assignments/new", label: "Create assignment", icon: IconFileText },
  ] },
  faculty: { groupLabel: "Faculty", menus: [
    { href: "/dashboard", label: "Faculty workspace", icon: IconSchool },
  ] },
  reviewer: { groupLabel: "Reviewer", menus: [
    { href: "/dashboard", label: "Review workspace", icon: IconClipboardCheck },
  ] },
  paper_setter: { groupLabel: "Paper setter", menus: [
    { href: "/dashboard", label: "Paper setting workspace", icon: IconFileText },
  ] },
};

export function getMenuList(pathname: string, roles?: readonly WorkspaceRole[]): Group[] {
  if (roles !== undefined) {
    const groups = Object.entries(roleNavigation)
      .filter(([role]) => roles.some((assignedRole) => assignedRole === role))
      .map(([, group]) => ({
        ...group,
        menus: group.menus.map((menu) => ({
          ...menu,
          active: (pathname === menu.href || (menu.href !== "/dashboard" && pathname.startsWith(`${menu.href}/`))) &&
            !group.menus.some((other) => other.href.startsWith(`${menu.href}/`) &&
              (pathname === other.href || pathname.startsWith(`${other.href}/`))),
        })),
      }));
    return groups.length ? groups : [{ groupLabel: "Workspace", menus: [
      { href: "/dashboard", label: "My workspace", icon: IconLayoutDashboard, active: pathname === "/dashboard" },
    ] }];
  }
  // Keep the public sidebar demonstration independent of authenticated menus.
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Contents",
      menus: [
        {
          href: "",
          label: "Posts",
          icon: SquarePen,
          submenus: [
            {
              href: "/posts",
              label: "All Posts"
            },
            {
              href: "/posts/new",
              label: "New Post"
            }
          ]
        },
        {
          href: "/categories",
          label: "Categories",
          icon: Bookmark
        },
        {
          href: "/tags",
          label: "Tags",
          icon: Tag
        }
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/users",
          label: "Users",
          icon: Users
        },
        {
          href: "/account",
          label: "Account",
          icon: Settings
        }
      ]
    }
  ];
}
