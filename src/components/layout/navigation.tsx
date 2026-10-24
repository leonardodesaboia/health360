"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  History,
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
          { href: "/patient", label: "Home", icon: Home },
          { href: "/patient/plan", label: "My plan", icon: ListChecks },
          { href: "/patient/history", label: "History", icon: History },
        ]
      : [
          { href: "/doctor", label: "Reviews", icon: ClipboardList },
          { href: "/showcase", label: "Components", icon: Layers },
        ];
  return (
    <nav
      aria-label={
        role === "patient" ? "Patient navigation" : "Physician navigation"
      }
      className="flex flex-wrap gap-2"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href === "/patient/history" &&
            pathname.startsWith("/patient/history/")) ||
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
