"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CreditCard,
  CalendarCheck,
  Activity,
  FileText,
  BriefcaseMedical,
  UserCog,
  Wallet,
  Tags,
  LayoutGrid,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/types/user";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Principal",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "ESPECIALISTA", "PERSONAL_ADMINISTRATIVO"],
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        href: "/children",
        label: "Niños",
        icon: Users,
        roles: ["ADMIN", "ESPECIALISTA", "PERSONAL_ADMINISTRATIVO"],
      },
      {
        href: "/enrollments",
        label: "Inscripciones",
        icon: ClipboardList,
        roles: ["ADMIN", "PERSONAL_ADMINISTRATIVO"],
      },
      {
        href: "/payments",
        label: "Pagos",
        icon: CreditCard,
        roles: ["ADMIN", "PERSONAL_ADMINISTRATIVO"],
      },
      {
        href: "/areas",
        label: "Áreas",
        icon: LayoutGrid,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    title: "Operativo",
    items: [
      {
        href: "/attendance",
        label: "Asistencias",
        icon: CalendarCheck,
        roles: ["ADMIN", "ESPECIALISTA", "PERSONAL_ADMINISTRATIVO"],
      },
      {
        href: "/activities",
        label: "Actividades",
        icon: Activity,
        roles: ["ADMIN", "ESPECIALISTA", "PERSONAL_ADMINISTRATIVO"],
      },
      {
        href: "/reports",
        label: "Informes",
        icon: FileText,
        roles: ["ADMIN", "ESPECIALISTA"],
      },
    ],
  },
  {
    title: "Personal",
    items: [
      {
        href: "/specialists",
        label: "Especialistas",
        icon: BriefcaseMedical,
        roles: ["ADMIN"],
      },
      {
        href: "/staff",
        label: "Personal",
        icon: UserCog,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    title: "Finanzas",
    items: [
      {
        href: "/expenses",
        label: "Gastos",
        icon: Wallet,
        roles: ["ADMIN", "PERSONAL_ADMINISTRATIVO"],
      },
      {
        href: "/expenses/categories",
        label: "Categorías",
        icon: Tags,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        href: "/settings",
        label: "Configuración",
        icon: Settings,
        roles: ["ADMIN"],
      },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const sections = user
    ? NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.roles.includes(user.role)),
      })).filter((section) => section.items.length > 0)
    : [];

  return (
    <nav className="flex flex-col gap-1 px-3 py-2" aria-label="Navegación principal">
      {sections.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          {section.items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-surface lg:block">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white ring-1 ring-brand-tea/50 transition-shadow hover:ring-2 hover:ring-brand-tea">
            Ps
          </span>
          PsicoTea
        </Link>
      </div>
      <div className="overflow-y-auto pb-6 pt-2">
        <SidebarNav />
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="px-3 py-2" aria-label="Navegación móvil">
      <p className="mb-2 px-3 text-base font-bold">PsicoTea</p>
      <SidebarNav onNavigate={() => undefined} />
    </nav>
  );
}