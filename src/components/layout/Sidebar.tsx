import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  Calendar,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  Receipt,
  Settings,
  Tags,
  Target,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

const navEntries: NavEntry[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  {
    label: "Financeiro",
    icon: Wallet,
    items: [
      { to: "/accounts", icon: Wallet, label: "Contas" },
      { to: "/transactions", icon: ArrowRightLeft, label: "Transações" },
      { to: "/categories", icon: Tags, label: "Categorias" },
      { to: "/bills", icon: Receipt, label: "Pagar/Receber" },
    ],
  },
  {
    label: "Planejamento",
    icon: Target,
    items: [
      { to: "/subscriptions", icon: CreditCard, label: "Assinaturas" },
      { to: "/goals", icon: Target, label: "Metas" },
      { to: "/closures", icon: Calendar, label: "Fechamentos" },
    ],
  },
];

function SidebarGroup({ group }: { group: NavGroup }) {
  const location = useLocation();
  const isChildActive = group.items.some(
    (item) => item.to === location.pathname || (item.to !== "/" && location.pathname.startsWith(item.to))
  );
  const [open, setOpen] = useState(isChildActive);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isChildActive
            ? "text-foreground"
            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <group.icon className="h-5 w-5" />
          {group.label}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            open ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background flex flex-col">
      <div className="flex h-16 items-center border-b border-border px-6 shrink-0">
        <img src="./icon.png" alt="Finora" className="h-8 w-8 mr-3" />
        <h1 className="text-xl font-bold text-primary">Finora</h1>
      </div>
      <nav className="flex flex-col gap-1 p-4 overflow-y-auto flex-1 hover:scrollbar-visible">
        {navEntries.map((entry) => {
          if (isGroup(entry)) {
            return <SidebarGroup key={entry.label} group={entry} />;
          }
          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )
              }
            >
              <entry.icon className="h-5 w-5" />
              {entry.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground">
          <Settings className="h-5 w-5" />
          <span>Finora Desktop v1.0</span>
        </div>
      </div>
    </aside>
  );
}
