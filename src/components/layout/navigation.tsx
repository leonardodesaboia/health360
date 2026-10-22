"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  Layers,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation({ role }: { role: "patient" | "doctor" }) {
  const pathname = usePathname();
  const items: { href: string; label: string; icon: LucideIcon }[] =
    role === "patient"
      ? [
          { href: "/patient", label: "Início", icon: Home },
          { href: "/patient/plan", label: "Meu plano", icon: ListChecks },
        ]
      : [
          { href: "/doctor", label: "Revisões", icon: ClipboardList },
          { href: "/showcase", label: "Componentes", icon: Layers },
        ];
  return (
    <nav
      aria-label={
        role === "patient" ? "Navegação do paciente" : "Navegação médica"
      }
      className="flex flex-wrap gap-2"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href === "/doctor" && pathname.startsWith("/doctor/reviews/"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-medium hover:bg-navigation-hover",
              active &&
                "bg-navigation-active text-navigation-active-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
