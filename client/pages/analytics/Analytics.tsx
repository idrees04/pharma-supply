import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/hooks/useStore';
import { formatCurrency, cn, formatDate } from '@/lib/utils';
import { downloadJSON, downloadCSV } from '@/lib/exportUtils';

type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const { hasPermission } = useAuth();
  const {
    purchaseOrders,
    deliveryChallans,
    payments,
    dailyExpenses,
    taxInvoices,
    bankAccounts,
    products,
    inventoryItems,
    suppliers,
  } = useStore();

  const canExport = hasPermission('reports', 'read') || hasPermission('admin', 'read');

  // Date range logic
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start = new Date();

    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        start.setDate(1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          return { startDate: start, endDate: new Date(customEndDate) };
        }
        break;
    }

    return { startDate: start, endDate: now };
  }, [dateRange, customStartDate, customEndDate]);

  // Filter data by date range
  const filterByDateRange = useCallback(
    (data: Array<{ invoiceDate?: string; createdDate?: string; date?: string }>) => {
      return data.filter((item) => {
        const itemDate = new Date(
          item.invoiceDate || item.createdDate || item.date || new Date()
        );
        return itemDate >= startDate && itemDate <= endDate;
      });
    },
    [startDate, endDate]
  );

  // Calculate metrics
  const filteredInvoices = useMemo(
    () => filterByDateRange(taxInvoices),
    [taxInvoices, filterByDateRange]
  );
  const filteredPOs = useMemo(
    () => filterByDateRange(purchaseOrders),
    [purchaseOrders, filterByDateRange]
  );
  const filteredExpenses = useMemo(
    () => filterByDateRange(dailyExpenses),
    [dailyExpenses, filterByDateRange]
  );

  const metrics = useMemo(() => {
    const revenue = filteredInvoices.reduce(
      (sum, inv) => sum + (inv.totalNetAmount || 0),
      0
    );
    const costOfGoods = filteredPOs.reduce(
      (sum, po) => sum + (po.netPayableAmount || 0),
      0
    );
    const expenses = filteredExpenses.reduce(
      (sum, exp) => sum + (exp.totalAmount || 0),
      0
    );
    const profit = revenue - costOfGoods - expenses;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : '0.00';

    return {
      revenue,
      costOfGoods,
      expenses,
      profit,
      margin,
      invoiceCount: filteredInvoices.length,
      poCount: filteredPOs.length,
      expenseCount: filteredExpenses.length,
    };
  }, [filteredInvoices, filteredPOs, filteredExpenses]);

  const topCustomers = useMemo(() => {
    const customerMap = new Map<
      string,
      { name: string; total: number; count: number }
    >();
    filteredInvoices.forEach((inv) => {
      const existing = customerMap.get(inv.customerName) || {
        name: inv.customerName,
        total: 0,
        count: 0,
      };
      customerMap.set(inv.customerName, {
        ...existing,
        total: existing.total + inv.totalNetAmount,
        count: existing.count + 1,
      });
    });
    return Array.from(customerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredInvoices]);

  const topProducts = useMemo(() => {
    const productMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();
    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const existing = productMap.get(item.product) || {
          name: item.product,
          quantity: 0,
          revenue: 0,
        };
        productMap.set(item.product, {
          ...existing,
          quantity: existing.quantity + (item.quantity || 1),
          revenue: existing.revenue + (item.amount || 0),
        });
      });
    });
    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredInvoices]);

  const expenseBreakdown = useMemo(() => {
    const categoryMap = new Map<string, number>();
    filteredExpenses.forEach((exp) => {
      const existing = categoryMap.get(exp.category) || 0;
      categoryMap.set(exp.category, existing + exp.totalAmount);
    });
    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  const handleExportAnalytics = () => {
    if (!canExport) {
      toast.error('You do not have permission to export data');
      return;
    }
    try {
      const exportData = {
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        metrics,
        topCustomers,
        topProducts,
        expenseBreakdown,
      };
      downloadJSON(exportData, `analytics-${new Date().toISOString().split('T')[0]}`);
      toast.success('Analytics exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Comprehensive business metrics and insights
          </p>
        </div>
        {canExport && (
          <Button onClick={handleExportAnalytics} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        )}
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="w-full sm:w-auto">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Date Range
          </label>
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-full sm:w-40 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dateRange === 'custom' && (
          <>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Start Date
              </label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-40 mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                End Date
              </label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-40 mt-1"
              />
            </div>
          </>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(metrics.revenue)}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-blue-500"
          iconColor="text-blue-600 bg-blue-50"
        />
        <MetricCard
          label="Gross Profit"
          value={formatCurrency(metrics.profit)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-green-500"
          iconColor="text-green-600 bg-green-50"
        />
        <MetricCard
          label="Total Expenses"
          value={formatCurrency(metrics.expenses)}
          icon={<Package className="w-5 h-5" />}
          color="bg-red-500"
          iconColor="text-red-600 bg-red-50"
        />
        <MetricCard
          label="Profit Margin"
          value={`${metrics.margin}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-purple-500"
          iconColor="text-purple-600 bg-purple-50"
        />
      </div>

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Period Summary</h3>
              <div className="space-y-3">
                <SummaryRow
                  label="Invoices Created"
                  value={metrics.invoiceCount}
                  subtext="Tax invoices"
                />
                <SummaryRow
                  label="Purchase Orders"
                  value={metrics.poCount}
                  subtext="Procurement orders"
                />
                <SummaryRow
                  label="Expense Entries"
                  value={metrics.expenseCount}
                  subtext="Daily expenses"
                />
                <SummaryRow
                  label="Profit Margin"
                  value={`${metrics.margin}%`}
                  subtext="Of total revenue"
                />
              </div>
            </Card>

            {/* Financial Summary */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Financial Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Revenue
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(metrics.revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Cost of Goods
                  </p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {formatCurrency(metrics.costOfGoods)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Operating Expenses
                  </p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {formatCurrency(metrics.expenses)}
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Net Profit
                  </p>
                  <p
                    className={cn(
                      'text-3xl font-bold mt-1',
                      metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {formatCurrency(metrics.profit)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Customers */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Top Customers</h3>
              <div className="space-y-2">
                {topCustomers.length > 0 ? (
                  topCustomers.map((customer, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {customer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.count} transaction{customer.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="font-semibold ml-2">
                        {formatCurrency(customer.total)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No sales data</p>
                )}
              </div>
            </Card>

            {/* Top Products */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Top Products</h3>
              <div className="space-y-2">
                {topProducts.length > 0 ? (
                  topProducts.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantity} unit{product.quantity !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="font-semibold ml-2">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No product data</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Expense Breakdown</h3>
            <div className="space-y-2">
              {expenseBreakdown.length > 0 ? (
                expenseBreakdown.map((expense, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{expense.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-slate-200 rounded h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full"
                          style={{
                            width: `${
                              (expense.amount /
                                (expenseBreakdown[0]?.amount || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <p className="font-semibold w-32 text-right">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No expense data</p>
              )}
            </div>
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(metrics.expenses)}
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OperationMetric
              label="Total Suppliers"
              value={suppliers.length}
              icon={<Users className="w-5 h-5" />}
            />
            <OperationMetric
              label="Total Products"
              value={products.length}
              icon={<Package className="w-5 h-5" />}
            />
            <OperationMetric
              label="Total Deliveries"
              value={deliveryChallans.length}
              icon={<Truck className="w-5 h-5" />}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
  iconColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  iconColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div
          className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-[0.04] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500`}
        />
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {label}
            </p>
            <p className="text-xl font-bold tracking-tight mt-0.5 truncate">
              {value}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function SummaryRow({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </div>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function OperationMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-semibold">
            {label}
          </p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </Card>
  );
}
