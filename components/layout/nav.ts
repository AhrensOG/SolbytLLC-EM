import {
  Home,
  ArrowLeftRight,
  Tag,
  Repeat,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  labelShort?: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  {
    href: "/transactions",
    label: "Transacciones",
    labelShort: "Movimientos",
    icon: ArrowLeftRight,
  },
  { href: "/categories", label: "Categorías", icon: Tag },
  {
    href: "/recurring",
    label: "Recurrentes",
    labelShort: "Recurrentes",
    icon: Repeat,
  },
  { href: "/teams", label: "Equipos", icon: Users },
  { href: "/settings", label: "Ajustes", icon: Settings },
];
