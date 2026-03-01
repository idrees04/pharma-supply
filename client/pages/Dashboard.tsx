import { useStore } from '@/hooks/useStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Package,
  Pill,
  Truck,
  Users,
  ArrowRight,
  AlertCircle,
  Calendar,
  Layers,
  ShoppingBag,
  Activity,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useInventoryStocks, useExpiringBatches } from '@/api/services/inventory';
import { useExpenseList } from '@/api/services/expenses';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const {
    purchaseOrders,
    deliveryChallans,
    payments,
    taxInvoices,
  } = useStore();

  // Fetch real-time data using existing API hooks
  const { data: inventoryData } = useInventoryStocks({ pageSize: 100 });
  const { data: expiringBatches } = useExpiringBatches();
  const { data: expenseData } = useExpenseList({ pageSize: 5 });

  // Calculate metrics
  const totalRevenue = taxInvoices.reduce((sum, inv) => sum + inv.totalNetAmount, 0);
  const totalPurchaseValue = purchaseOrders.reduce((sum, po) => sum + po.netPayableAmount, 0);
  
  const recentExpenses = expenseData?.items || [];
  const totalExpensesValue = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const totalProfit = totalRevenue - totalPurchaseValue - totalExpensesValue;
  
  const inventoryItems = inventoryData?.items || [];
  const lowStockCount = inventoryItems.filter(i => i.availableQuantity <= 10).length;
  const outOfStockCount = inventoryItems.filter(i => i.totalQuantity === 0).length;
  const expiredCount = expiringBatches?.length || 0;

  const pendingPaymentsCount = payments.filter((p) => {
    const poTotal = purchaseOrders.find((po) => po.id === p.poId)?.netPayableAmount || 0;
    return p.amount < poTotal;
  }).length;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Executive Overview</h1>
          <p className="text-muted-foreground mt-1 text-lg">Ideal Distributor Management Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-primary/10 rounded-full flex items-center gap-2 text-primary font-medium">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={<DollarSign className="w-6 h-6" />}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          trend="+12.5%"
          trendType="up"
          color="blue"
        />
        <KPICard
          icon={<ShoppingBag className="w-6 h-6" />}
          label="Procurement Value"
          value={formatCurrency(totalPurchaseValue)}
          trend="+8.2%"
          trendType="up"
          color="amber"
        />
        <KPICard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Estimated Profit"
          value={formatCurrency(totalProfit)}
          trend="+5.1%"
          trendType="up"
          color="green"
        />
        <KPICard
          icon={<AlertCircle className="w-6 h-6" />}
          label="Inventory Alerts"
          value={`${expiredCount} Expired`}
          description={`${lowStockCount} Low Stock Items`}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Stats */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Activity Section */}
          <motion.div variants={item}>
            <Card className="overflow-hidden border-none shadow-lg dark:surface-card">
              <div className="bg-muted/50 dark:bg-muted/10 p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Recent Transactions
                  </h3>
                  <Link to="/invoices">
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10 transition-colors">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-0">
                <div className="divide-y divide-border/50">
                  {taxInvoices.slice(-5).reverse().map((invoice) => (
                    <div key={invoice.id} className="p-4 hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{invoice.customerName}</p>
                          <p className="text-xs text-muted-foreground">{invoice.invoiceNo} • {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-blue-600 dark:text-blue-400">{formatCurrency(invoice.totalNetAmount)}</p>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                          Invoice
                        </span>
                      </div>
                    </div>
                  ))}
                  {taxInvoices.length === 0 && (
                    <div className="p-12 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No recent invoices found</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Business Distribution */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatActionCard
              icon={<Truck className="w-6 h-6" />}
              label="Delivery Challans"
              value={deliveryChallans.length}
              description="Confirmed shipments"
              href="/delivery"
              color="indigo"
            />
            <StatActionCard
              icon={<Users className="w-6 h-6" />}
              label="Pending Payments"
              value={pendingPaymentsCount}
              description="Outstanding receivables"
              href="/finance/payments"
              color="amber"
            />
          </motion.div>
        </div>

        {/* Right Column - Inventory & Actions */}
        <div className="space-y-8">
          {/* Inventory Health */}
          <motion.div variants={item}>
            <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-card to-muted/30">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Inventory Health
              </h3>
              <div className="space-y-6">
                <InventoryHealthItem
                  label="In Stock Products"
                  value={inventoryItems.length - outOfStockCount}
                  total={inventoryItems.length}
                  color="bg-green-500"
                />
                <InventoryHealthItem
                  label="Low Stock Alerts"
                  value={lowStockCount}
                  total={inventoryItems.length}
                  color="bg-amber-500"
                />
                <InventoryHealthItem
                  label="Expired / Near Expiry"
                  value={expiredCount}
                  total={inventoryItems.length}
                  color="bg-red-500"
                />
              </div>
              <div className="mt-8">
                <Link to="/inventory">
                  <Button className="w-full shadow-md">
                    Manage Inventory
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>

          {/* Quick Access Actions */}
          <motion.div variants={item}>
            <Card className="p-6 border-none shadow-lg">
              <h3 className="text-lg font-bold mb-4">Core Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                <QuickActionButton
                  icon={<FileText className="w-4 h-4" />}
                  label="Create Purchase Order"
                  href="/orders/purchase/create"
                />
                <QuickActionButton
                  icon={<Truck className="w-4 h-4" />}
                  label="Dispatch Goods"
                  href="/delivery"
                />
                <QuickActionButton
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Record Expense"
                  href="/finance/expenses"
                />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
  trend?: string;
  trendType?: 'up' | 'down';
  color: 'blue' | 'amber' | 'green' | 'red' | 'indigo';
}

function KPICard({ icon, label, value, description, trend, trendType, color }: KPICardProps) {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20',
    green: 'from-green-500/20 to-green-500/5 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-500/20',
    red: 'from-red-500/20 to-red-500/5 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-500/20',
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-500/20',
  };

  const iconBgMap = {
    blue: 'bg-blue-100 dark:bg-blue-500/20',
    amber: 'bg-amber-100 dark:bg-amber-500/20',
    green: 'bg-green-100 dark:bg-green-500/20',
    red: 'bg-red-100 dark:bg-red-500/20',
    indigo: 'bg-indigo-100 dark:bg-indigo-500/20',
  };

  return (
    <motion.div variants={item}>
      <Card className={cn("p-6 relative overflow-hidden border shadow-sm transition-all hover:shadow-md dark:surface-card", colorMap[color])}>
        <div className="relative z-10">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm", iconBgMap[color])}>
            <div className="dark:text-current">{icon}</div>
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h4 className="text-2xl font-black text-foreground">{value}</h4>
            {trend && (
              <span className={cn(
                "text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5",
                trendType === 'up' ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
              )}>
                {trendType === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend}
              </span>
            )}
          </div>
          {(description || trend) && (
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {description || `Increased from last month`}
            </p>
          )}
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-current opacity-[0.03] rounded-full" />
      </Card>
    </motion.div>
  );
}

interface StatActionCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  href: string;
  color: 'blue' | 'amber' | 'green' | 'red' | 'indigo';
}

function StatActionCard({ icon, label, value, description, href, color }: StatActionCardProps) {
  const iconColorMap = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20',
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20',
  };

  return (
    <Link to={href}>
      <Card className="p-5 hover:shadow-lg transition-all border-none shadow group relative overflow-hidden dark:surface-card">
        <div className="flex items-center gap-5 relative z-10">
          <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", iconColorMap[color])}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground">{label}</p>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
          <ArrowRight className="w-5 h-5 text-primary" />
        </div>
      </Card>
    </Link>
  );
}

function InventoryHealthItem({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-bold">{value} <span className="text-muted-foreground font-normal">/ {total}</span></span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)} 
        />
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <Link to={href}>
      <Button variant="outline" className="w-full justify-between hover:bg-primary hover:text-primary-foreground group transition-all h-11 border-dashed">
        <div className="flex items-center gap-2 font-semibold">
          {icon}
          {label}
        </div>
        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Button>
    </Link>
  );
}
