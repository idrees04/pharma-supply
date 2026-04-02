import { useStore } from "@/hooks/useStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Users,
  Download,
  FileJson,
} from "lucide-react";
import { formatCurrency } from '@/utils/formatters';
import {
  downloadCSV,
  downloadJSON,
  generateSalesReport,
  generateFinancialReport,
  generateInventoryReport,
  generateProcurementReport,
} from "@/lib/exportUtils";
import { toast } from "sonner";

export default function Reports() {
  const {
    purchaseOrders,
    deliveryChallans,
    payments,
    dailyExpenses,
    taxInvoices,
    bankAccounts,
    internalTransfers,
    products,
    inventoryItems,
    suppliers,
  } = useStore();

  const handleExportSalesReport = () => {
    try {
      const reportData = generateSalesReport([], taxInvoices);
      downloadJSON(reportData, `sales-report-${new Date().toISOString().split('T')[0]}`);
      toast.success('Sales report exported successfully');
    } catch (error) {
      toast.error('Failed to export sales report');
    }
  };

  const handleExportFinancialReport = () => {
    try {
      const reportData = generateFinancialReport(
        bankAccounts,
        internalTransfers,
        payments,
        dailyExpenses,
      );
      downloadJSON(reportData, `financial-report-${new Date().toISOString().split('T')[0]}`);
      toast.success('Financial report exported successfully');
    } catch (error) {
      toast.error('Failed to export financial report');
    }
  };

  const handleExportInventoryReport = () => {
    try {
      const reportData = generateInventoryReport(products, inventoryItems);
      downloadJSON(reportData, `inventory-report-${new Date().toISOString().split('T')[0]}`);
      toast.success('Inventory report exported successfully');
    } catch (error) {
      toast.error('Failed to export inventory report');
    }
  };

  const handleExportProcurementReport = () => {
    try {
      const reportData = generateProcurementReport(purchaseOrders, suppliers);
      downloadJSON(reportData, `procurement-report-${new Date().toISOString().split('T')[0]}`);
      toast.success('Procurement report exported successfully');
    } catch (error) {
      toast.error('Failed to export procurement report');
    }
  };

  const handleExportOrdersCSV = () => {
    try {
      const csvData = taxInvoices.map((inv) => ({
        'Invoice ID': inv.invoiceNo,
        'Customer': inv.customerName,
        'Date': inv.invoiceDate,
        'Amount': inv.totalNetAmount,
      }));
      downloadCSV(csvData, `tax-invoices-${new Date().toISOString().split('T')[0]}`);
      toast.success('Invoices exported as CSV');
    } catch (error) {
      toast.error('Failed to export invoices');
    }
  };

  // Calculate metrics
  const totalSales = taxInvoices.reduce((sum, inv) => sum + inv.totalNetAmount, 0);
  const totalPurchase = purchaseOrders.reduce(
    (sum, po) => sum + po.netPayableAmount,
    0,
  );
  const totalExpenses = dailyExpenses.reduce(
    (sum, exp) => sum + exp.totalAmount,
    0,
  );
  const totalProfit = totalSales - totalPurchase - totalExpenses;
  const totalPayroll = 0; // Payroll removed
  const totalDelivered = deliveryChallans.reduce(
    (sum, dc) => sum + dc.items.reduce((s, item) => s + item.quantity, 0),
    0,
  );
  const totalPaymentsMade = payments.reduce((sum, p) => sum + p.amount, 0);

  const profitMargin =
    totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(2) : "0.00";
  const expenseRatio =
    totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(2) : "0.00";

  // Get top performed invoices by amount
  const topInvoices = [...taxInvoices]
    .sort((a, b) => b.totalNetAmount - a.totalNetAmount)
    .slice(0, 5);

  // Get invoice payment status breakdown (simulated from taxInvoices as a placeholder)
  const paymentStatusBreakdown = {
    cleared: taxInvoices.length,
    partial: 0,
    pending: 0,
  };

  // Get top performing items
  const itemSalesMap = new Map<string, number>();
  taxInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const key = item.product;
      itemSalesMap.set(key, (itemSalesMap.get(key) || 0) + item.amount);
    });
  });

  const topItems = Array.from(itemSalesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSalesReport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Sales Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportFinancialReport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Financial Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportInventoryReport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Inventory Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportProcurementReport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Procurement Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportOrdersCSV}
            className="gap-2"
          >
            <FileJson className="w-4 h-4" />
            Orders CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Total Revenue"
          value={formatCurrency(totalSales)}
          color="bg-blue-500"
        />
        <MetricCard
          icon={<Package className="w-6 h-6" />}
          label="Total Cost"
          value={formatCurrency(totalPurchase)}
          color="bg-amber-500"
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Total Profit"
          value={formatCurrency(totalProfit)}
          color="bg-green-500"
        />
        <MetricCard
          icon={<BarChart3 className="w-6 h-6" />}
          label="Profit Margin"
          value={`${profitMargin}%`}
          color="bg-purple-500"
        />
      </div>

      {/* Operating Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Truck className="w-6 h-6" />}
          label="Items Delivered"
          value={totalDelivered.toString()}
          color="bg-indigo-500"
        />
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Expenses"
          value={formatCurrency(totalExpenses)}
          color="bg-red-500"
        />
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="Payroll"
          value={formatCurrency(totalPayroll)}
          color="bg-pink-500"
        />
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Payments Made"
          value={formatCurrency(totalPaymentsMade)}
          color="bg-teal-500"
        />
      </div>

      {/* Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span>Total Purchase Orders</span>
                  <span className="font-semibold">{purchaseOrders.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span>Supply Orders</span>
                  <span className="font-semibold">{useStore.getState().supplyOrders.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span>Invoices Generated</span>
                  <span className="font-semibold">{taxInvoices.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                  <span>Expense Vouchers</span>
                  <span className="font-semibold">{dailyExpenses.length}</span>
                </div>
              </div>
            </Card>

            {/* Payment Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Payment Status Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Cleared</span>
                  </div>
                  <span className="font-semibold">
                    {paymentStatusBreakdown.cleared} orders
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span>Partial</span>
                  </div>
                  <span className="font-semibold">
                    {paymentStatusBreakdown.partial} orders
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Pending</span>
                  </div>
                  <span className="font-semibold">
                    {paymentStatusBreakdown.pending} orders
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Analysis Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Invoices */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Top Invoices by Amount
              </h3>
              <div className="space-y-3">
                {topInvoices.length > 0 ? (
                  topInvoices.map((inv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {inv.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inv.invoiceNo}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(inv.totalNetAmount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No invoice data available
                  </p>
                )}
              </div>
            </Card>

            {/* Top Items */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
              <div className="space-y-3">
                {topItems.length > 0 ? (
                  topItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item[0]}</p>
                        <p className="text-xs text-muted-foreground">
                          #{idx + 1}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(item[1])}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No item data available
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Revenue</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(totalSales)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  From {taxInvoices.length} invoices
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Cost of Goods
                </p>
                <p className="text-3xl font-bold">
                  {formatCurrency(totalPurchase)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((totalPurchase / totalSales) * 100 || 0).toFixed(2)}% of
                  revenue
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Gross Profit
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(totalProfit)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {profitMargin}% margin
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Operating Expenses
                </p>
                <p className="text-3xl font-bold">
                  {formatCurrency(totalExpenses + totalPayroll)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {expenseRatio}% of revenue
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Delivery Metrics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Delivery Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Total Delivery Challans</span>
                  <span className="font-semibold">
                    {deliveryChallans.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Total Items Delivered</span>
                  <span className="font-semibold">{totalDelivered}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Avg Items per DC</span>
                  <span className="font-semibold">
                    {(totalDelivered / (deliveryChallans.length || 1)).toFixed(
                      2,
                    )}
                  </span>
                </div>
              </div>
            </Card>

            {/* Payroll Removed */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Operations Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Total Suppliers</span>
                  <span className="font-semibold">{suppliers.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm">Total Products</span>
                  <span className="font-semibold">{products.length}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* PO and Invoice Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Procurement Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Purchase Orders
                </p>
                <p className="text-3xl font-bold">{purchaseOrders.length}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {formatCurrency(
                    purchaseOrders.reduce(
                      (sum, po) => sum + po.netPayableAmount,
                      0,
                    ),
                  )}{" "}
                  total value
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Tax Invoices
                </p>
                <p className="text-3xl font-bold">{taxInvoices.length}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {formatCurrency(
                    taxInvoices.reduce(
                      (sum, inv) => sum + inv.totalNetAmount,
                      0,
                    ),
                  )}{" "}
                  total value
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Payments Made
                </p>
                <p className="text-3xl font-bold">{payments.length}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {formatCurrency(totalPaymentsMade)} total
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  return (
    <Card className="p-6 relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-full -mr-12 -mt-12`}
      />
      <div className="relative z-10">
        <div
          className={`w-12 h-12 rounded-lg ${color} bg-opacity-10 flex items-center justify-center mb-3`}
        >
          <div className={`${color} bg-opacity-20 text-white`}>{icon}</div>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
}
