"use client";

import Link from "next/link";
import { useState } from "react";
import { MenuIcon, PanelsTopLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu } from "@/components/admin-panel/menu";
import {
  Sheet,
  SheetHeader,
  SheetContent,
  SheetTrigger,
  SheetTitle
} from "@/components/ui/sheet";

export function SheetMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="lg:hidden" render={<Button className="h-8" variant="outline" size="icon" aria-label="Open navigation" />}><MenuIcon size={20} aria-hidden /></SheetTrigger>
      <SheetContent className="sm:w-72 px-3 h-full flex flex-col" side="left">
        <SheetHeader>
          <Button className="flex justify-center items-center pb-2 pt-1" variant="link" render={<Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2" />} nativeButton={false}><PanelsTopLeft className="w-6 h-6 mr-1" /><SheetTitle className="font-bold text-lg">ExamGom</SheetTitle></Button>
        </SheetHeader>
        <Menu isOpen onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
