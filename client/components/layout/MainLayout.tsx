import { ReactNode, useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserNav } from "./UserNav";
import { ThemeToggle } from "./ThemeToggle";
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
import { useAuth } from "@/context/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MainLayoutProps {
  children: ReactNode;
}

interface MenuItemType {
  icon: React.ReactNode;
  label: string;
  href?: string;
  exact?: boolean;
  tooltip?: string;
  /** Module for permission check - if set, item is hidden when user lacks access */
  module?: string;
  children?: MenuItemType[];
}

/** Match sidebar links including `/reports?module=…` query strings. */
function menuHrefIsActive(
  href: string,
  pathname: string,
  search: string,
  exact?: boolean,
): boolean {
  const qIdx = href.indexOf("?");
  const path = qIdx >= 0 ? href.slice(0, qIdx) : href;
  const qs = qIdx >= 0 ? href.slice(qIdx + 1) : "";
  if (qs) {
    if (pathname !== path) return false;
    const want = new URLSearchParams(qs);
    const have = new URLSearchParams(search);
    for (const [k, v] of want.entries()) {
      if (have.get(k) !== v) return false;
    }
    return true;
  }
  if (exact) return pathname === path;
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

const menuItems: MenuItemType[] = [
  {
    icon: <Home className="w-5 h-5" />,
    label: "Dashboard",
    href: "/",
    // Dashboard is accessible to all authenticated users
  },
  {
    icon: <Package className="w-5 h-5" />,
    label: "Inventory",
    module: "inventory",
    children: [
      {
        icon: <Package className="w-4 h-4" />,
        label: "Stock Levels",
        href: "/inventory",
        exact: true,
        module: "inventory",
      },
      {
        icon: <Pill className="w-4 h-4" />,
        label: "Products",
        href: "/inventory/products",
        module: "products",
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
        module: "suppliers",
      },
      {
        icon: <Users className="w-4 h-4" />,
        label: "Hospitals",
        href: "/hospitals",
        module: "hospitals",
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
        tooltip: "Orders supplied to customers",
        module: "supplyOrders",
      },
      {
        icon: <FileText className="w-4 h-4" />,
        label: "Purchase Orders",
        href: "/orders/purchase",
        tooltip: "Orders created for company procurement",
        module: "purchaseOrders",
      },
    ],
  },
  // {
  //   icon: <Truck className="w-5 h-5" />,
  //   label: "Delivery",
  //   href: "/delivery",
  //   module: "deliveryChallans",
  // },
  {
    icon: <Receipt className="w-5 h-5" />,
    label: "Invoices",
    href: "/invoices",
    module: "invoices",
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    label: "Finance",
    module: "bankAccounts", // Parent requires at least bankAccounts access
    children: [
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: "Bank Accounts",
        href: "/finance/accounts",
        module: "bankAccounts",
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: "Transfers",
        href: "/finance/transfers",
        module: "transfers",
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: "Expenses",
        href: "/finance/expenses",
        module: "expenses",
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: "Income",
        href: "/finance/incomes",
        module: "incomes",
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: "Payments",
        href: "/finance/payments",
        module: "payments",
      },
    ],
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    label: "Reports",
    module: "reports",
    children: [
      {
        icon: <FileText className="w-4 h-4" />,
        label: "Supply orders",
        href: "/reports?module=supply-order",
        module: "reports",
      },
      {
        icon: <Package className="w-4 h-4" />,
        label: "Inventory",
        href: "/reports?module=inventory",
        module: "reports",
      },
      {
        icon: <Truck className="w-4 h-4" />,
        label: "Purchase",
        href: "/reports?module=purchase",
        module: "reports",
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: "Finance",
        href: "/reports?module=finance",
        module: "reports",
      },
    ],
  },
  {
    icon: <Settings className="w-5 h-5" />,
    label: "Settings",
    module: "products", // Settings requires product management access
    children: [
      {
        icon: <Package className="w-4 h-4" />,
        label: "Product Types",
        href: "/settings/product-types",
        module: "products",
      },
      {
        icon: <Pill className="w-4 h-4" />,
        label: "Units",
        href: "/settings/units",
        module: "products",
      },
      {
        icon: <Receipt className="w-4 h-4" />,
        label: "Expense Categories",
        href: "/settings/expense-categories",
        module: "expenses",
      },
      {
        icon: <Receipt className="w-4 h-4" />,
        label: "Income Categories",
        href: "/settings/income-categories",
        module: "incomeCategories",
      },
      {
        icon: <Shield className="w-4 h-4" />,
        label: "Tax Configuration",
        href: "/settings/tax-configuration",
        module: "products",
      },
      {
        icon: <Settings className="w-4 h-4" />,
        label: "System Configuration",
        href: "/settings/system-configuration",
        module: "systemConfiguration",
      },
    ],
  },
];

/**
 * Filter menu items based on user permissions
 * Recursively filters children and removes parent items with no visible children
 */
function filterMenuItems(
  items: MenuItemType[],
  canAccess: (module: string) => boolean
): MenuItemType[] {
  return items
    .filter((item) => {
      // If no module specified, item is visible to all
      if (!item.module) return true;
      // Check if user has access to this module
      return canAccess(item.module);
    })
    .map((item) => ({
      ...item,
      // Recursively filter children
      children: item.children ? filterMenuItems(item.children, canAccess) : undefined,
    }))
    // Remove parent items that have no visible children
    .filter((item) => !item.children || item.children.length > 0);
}

export function MainLayout({ children }: MainLayoutProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { pathname, search } = location;
  const { canAccess } = useAuth();

  // Filter menu items based on user permissions (memoized for performance)
  const visibleMenuItems = useMemo(
    () => filterMenuItems(menuItems, canAccess),
    [canAccess]
  );

  // Automatically expand parent menu based on current route (path + query)
  useEffect(() => {
    for (const item of visibleMenuItems) {
      if (!item.children) continue;
      for (const child of item.children) {
        if (!child.href) continue;
        if (menuHrefIsActive(child.href, pathname, search, child.exact)) {
          setOpenSubmenu(item.label);
          return;
        }
      }
    }
  }, [pathname, search, visibleMenuItems]);

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
              src="/ideal-distributor-icon.png"
              alt="Ideal Distributor Logo"
              className="w-6 h-6 object-contain"
            />
            <span>Ideal Distributor</span>
          </Link>

          {/* User Nav - Visible on all screens */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden">
              <ThemeToggle />
            </div>
            <UserNav />
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="py-4 space-y-2">
                  {visibleMenuItems.map((item, idx) => (
                    <SidebarMenuItem
                      key={idx}
                      item={item}
                      isOpen={openSubmenu === item.label}
                      onToggle={() =>
                        setOpenSubmenu(
                          openSubmenu === item.label ? null : item.label,
                        )
                      }
                      onClose={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-sidebar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex-1 space-y-2 p-4">
            {visibleMenuItems.map((item, idx) => (
              <SidebarMenuItem
                key={idx}
                item={item}
                isOpen={openSubmenu === item.label}
                onToggle={() =>
                  setOpenSubmenu(openSubmenu === item.label ? null : item.label)
                }
              />
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 overflow-auto">
          <div className="w-full p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

interface SidebarMenuItemProps {
  item: MenuItemType;
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

function SidebarMenuItem({
  item,
  isOpen,
  onToggle,
  onClose,
}: SidebarMenuItemProps) {
  const { pathname, search } = useLocation();
  const isActive = item.href
    ? menuHrefIsActive(item.href, pathname, search, item.exact)
    : false;
  const hasChildren = item.children && item.children.length > 0;

  const renderContent = () => {
    if (hasChildren) {
      return (
        <div className="mb-1">
          <button
            onClick={onToggle}
            className={cn(
              "w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "text-sidebar-foreground",
              isOpen && "bg-sidebar-accent/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("transition-colors", isOpen ? "text-primary" : "text-muted-foreground")}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {isOpen && (
            <div className="pl-4 mt-1 space-y-1 relative">
              <div className="absolute left-6 top-0 bottom-2 w-px bg-border/50" />
              {item.children!.map((child, idx) => {
                const isChildActive = child.href
                  ? menuHrefIsActive(child.href, pathname, search, child.exact)
                  : false;

                const childLink = (
                  <Link
                    key={idx}
                    to={child.href || "#"}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-all duration-200 ml-4",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isChildActive
                        ? "bg-primary/10 text-primary font-bold dark:sidebar-item-active"
                        : "text-sidebar-foreground/70",
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full", isChildActive ? "bg-primary" : "bg-muted-foreground/30")} />
                    <span>{child.label}</span>
                  </Link>
                );

                if (child.tooltip) {
                  return (
                    <TooltipProvider key={idx} delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {childLink}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{child.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }
                return childLink;
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.href || "#"}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 mb-1",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-primary/10 text-primary font-bold dark:sidebar-item-active border-r-2 border-primary"
            : "text-sidebar-foreground",
        )}
      >
        <div className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
          {item.icon}
        </div>
        <span>{item.label}</span>
      </Link>
    );
  };

  if (item.tooltip && !hasChildren) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {renderContent()}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return renderContent();
}
