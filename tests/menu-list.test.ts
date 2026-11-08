import { describe, expect, test } from "bun:test";
import { getMenuList } from "../lib/menu-list";
import type { WorkspaceRole } from "../types/workspace";

const linksFor = (roles: WorkspaceRole[], pathname = "/dashboard") =>
  getMenuList(pathname, roles).flatMap((group) => group.menus);

describe("role sidebar navigation", () => {
  test("shows user management for superadmins and exam controllers", () => {
    expect(linksFor(["superadmin"]).map((menu) => menu.href)).toContain("/dashboard/users");
    expect(linksFor(["exam_controller"]).map((menu) => menu.href)).toContain("/dashboard/users");
    for (const role of ["faculty", "reviewer", "paper_setter"] as const) {
      expect(linksFor([role]).map((menu) => menu.href)).not.toContain("/dashboard/users");
    }
  });

  test("shows assignment creation only for exam controllers", () => {
    expect(linksFor(["exam_controller"]).map((menu) => menu.href)).toContain("/dashboard/assignments/new");
    expect(linksFor(["exam_controller"]).map((menu) => menu.href)).toContain("/dashboard/assignments");
    for (const role of ["superadmin", "faculty", "reviewer", "paper_setter"] as const) {
      expect(linksFor([role]).map((menu) => menu.href)).not.toContain("/dashboard/assignments/new");
      expect(linksFor([role]).map((menu) => menu.href)).not.toContain("/dashboard/assignments");
    }
  });

  test("highlights the assignment list for details and creation separately", () => {
    const details = linksFor(["exam_controller"], "/dashboard/assignments/example-id");
    expect(details.filter((menu) => menu.active).map((menu) => menu.href)).toEqual(["/dashboard/assignments"]);
    const creation = linksFor(["exam_controller"], "/dashboard/assignments/new");
    expect(creation.filter((menu) => menu.active).map((menu) => menu.href)).toEqual(["/dashboard/assignments/new"]);
  });

  test.each(["superadmin", "exam_controller", "faculty", "reviewer", "paper_setter"] as const)("gives %s its own workspace section without demo links", (role) => {
    const groups = getMenuList("/dashboard", [role]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.groupLabel).toBe({ superadmin: "Superadmin", exam_controller: "Exam controller", faculty: "Faculty", reviewer: "Reviewer", paper_setter: "Paper setter" }[role]);
    expect(linksFor([role]).every((menu) => menu.href === "/dashboard" || menu.href.startsWith("/dashboard/"))).toBe(true);
  });

  test("combines assigned roles without duplicate sections", () => {
    const groups = getMenuList("/dashboard", ["superadmin", "exam_controller", "superadmin"]);
    expect(groups.map((group) => group.groupLabel)).toEqual(["Superadmin", "Exam controller"]);
    expect(groups.flatMap((group) => group.menus).map((menu) => menu.href)).toContain("/dashboard/assignments/new");
  });

  test("does not mark the dashboard active on nested pages or match partial route names", () => {
    const links = linksFor(["superadmin"], "/dashboard/users");
    expect(links.find((menu) => menu.href === "/dashboard")?.active).toBe(false);
    expect(links.find((menu) => menu.href === "/dashboard/users")?.active).toBe(true);
    expect(linksFor(["superadmin"], "/dashboard/users-extra").some((menu) => menu.active)).toBe(false);
  });

  test("provides a safe workspace link for accounts with no role", () => {
    expect(linksFor([]).map((menu) => menu.href)).toEqual(["/dashboard"]);
  });

  test("keeps the existing sidebar demo available without a signed-in user", () => {
    expect(getMenuList("/admin-testing").some((group) => group.groupLabel === "Contents")).toBe(true);
  });
});
