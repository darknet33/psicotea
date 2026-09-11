"use client";

import { useState } from "react";
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/dialog";
import { MobileNav } from "./sidebar";
import { UserMenu } from "./user-menu";

export function Header({
  title,
}: {
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-surface px-4 sm:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <MobileNav />
        </SheetContent>
      </Sheet>

      <h1 className="text-lg font-semibold">{title ?? "Dashboard"}</h1>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notificaciones">
          <Bell className="size-5" />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}