import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Home,
  FileText,
  Package,
  Truck,
  BarChart3,
  DollarSign,
  Users,
  Receipt,
  Pill,
  ChevronDown,
  ChevronUp,
  Shield,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

interface MenuItemType {
  icon: React.ReactNode;
  label: string;
  href?: string;
  children?: MenuItemType[];
}

const menuItems: MenuItemType[] = [
  {
    icon: <Home className="w-5 h-5" />,
    label: "Dashboard",
    href: "/",
  },
  {
    icon: <Package className="w-5 h-5" />,
    label: "Inventory",
    children: [
      {
        icon: <Package className="w-4 h-4" />,
        label: "Stock Levels",
        href: "/inventory",
      },
      {
        icon: <Pill className="w-4 h-4" />,
        label: "Products",
        href: "/inventory/products",
      },
    ],
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: "Masters",
    children: [
      {
        icon: <Users className="w-4 h-4" />,
        label: "Suppliers",
        href: "/suppliers",
      },
      {
        icon: <Users className="w-4 h-4" />,
        label: "Hospitals",
        href: "/hospitals",
      },
    ],
  },
  {
    icon: <FileText className="w-5 h-5" />,
    label: "Supply Chain",
    children: [
      {
        icon: <FileText className="w-4 h-4" />,
        label: "Supply Orders",
        href: "/supply-orders",
      },
      {
        icon: <FileText className="w-4 h-4" />,
        label: "Purchase Orders",
        href: "/orders/purchase",
      },
      {
        icon: <FileText className="w-4 h-4" />,
        label: "Sales Orders",
        href: "/orders/sales",
      },
    ],
  },
  {
    icon: <Truck className="w-5 h-5" />,
    label: "Delivery",
    href: "/delivery",
  },
  {
    icon: <Receipt className="w-5 h-5" />,
    label: "Invoices",
    href: "/invoices",
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    label: "Finance",
    children: [
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: "Bank Accounts",
        href: "/finance/accounts",
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: "Transfers",
        href: "/finance/transfers",
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: "Expenses",
        href: "/finance/expenses",
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: "Payments",
        href: "/finance/payments",
      },
    ],
  },
  {
    icon: <Pill className="w-5 h-5" />,
    label: "Tender",
    href: "/tender",
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: "Payroll",
    href: "/payroll",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    label: "Reports",
    href: "/reports",
  },
  {
    icon: <Settings className="w-5 h-5" />,
    label: "Settings",
    children: [
      {
        icon: <Package className="w-4 h-4" />,
        label: "Product Types",
        href: "/settings/product-types",
      },
      {
        icon: <Pill className="w-4 h-4" />,
        label: "Units",
        href: "/settings/units",
      },
    ],
  },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-lg text-primary"
          >
            <img
              src="/ideal-distributor.png"
              alt="Ideal Distributor Logo"
              className="w-6 h-6 object-contain"
            />
            <span>Ideal Distributor</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block" />

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="py-4 space-y-2">
                {menuItems.map((item, idx) => (
                  <SidebarMenuItem
                    key={idx}
                    item={item}
                    isOpen={openSubmenu === item.label}
                    onToggle={() =>
                      setOpenSubmenu(
                        openSubmenu === item.label ? null : item.label,
                      )
                    }
                    location={location.pathname}
                  />
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-sidebar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex-1 space-y-2 p-4">
            {menuItems.map((item, idx) => (
              <SidebarMenuItem
                key={idx}
                item={item}
                isOpen={openSubmenu === item.label}
                onToggle={() =>
                  setOpenSubmenu(openSubmenu === item.label ? null : item.label)
                }
                location={location.pathname}
              />
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

interface SidebarMenuItemProps {
  item: MenuItemType;
  isOpen: boolean;
  onToggle: () => void;
  location: string;
}

function SidebarMenuItem({
  item,
  isOpen,
  onToggle,
  location,
}: SidebarMenuItemProps) {
  const isActive = item.href && location.startsWith(item.href);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "text-sidebar-foreground",
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span>{item.label}</span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {isOpen && (
          <div className="pl-2 mt-1 space-y-1">
            {item.children.map((child, idx) => (
              <Link
                key={idx}
                to={child.href || "#"}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  location === child.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground",
                )}
              >
                {child.icon}
                <span>{child.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href || "#"}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground",
      )}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}
