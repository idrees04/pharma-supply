import { useStore } from '@/hooks/useStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function Dashboard() {
  const {
    tenders,
    purchaseOrders,
    salesOrders,
    deliveryChallans,
    payments,
    dailyExpenses,
    salaryVouchers,
    taxInvoices,
  } = useStore();

  const totalSalesAmount = salesOrders.reduce((sum, so) => sum + so.saleTotal, 0);
  const totalPurchaseAmount = salesOrders.reduce((sum, so) => sum + so.purchaseTotal, 0);
  const totalProfit = salesOrders.reduce((sum, so) => sum + so.profit, 0);
  const totalExpenses = dailyExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);

  const pendingPayments = payments.filter((p) => {
    const poTotal = purchaseOrders.find((po) => po.id === p.poId)?.netPayableAmount || 0;
    return p.amount < poTotal;
  }).length;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to Ideal Distributor Management System</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<DollarSign className="w-6 h-6" />}
          label="Total Sales"
          value={formatCurrency(totalSalesAmount)}
          color="bg-blue-500"
        />
        <KPICard
          icon={<Package className="w-6 h-6" />}
          label="Total Purchase"
          value={formatCurrency(totalPurchaseAmount)}
          color="bg-amber-500"
        />
        <KPICard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Total Profit"
          value={formatCurrency(totalProfit)}
          color="bg-green-500"
        />
        <KPICard
          icon={<TrendingDown className="w-6 h-6" />}
          label="Total Expenses"
          value={formatCurrency(totalExpenses)}
          color="bg-red-500"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Pill className="w-5 h-5" />}
          label="Active Tenders"
          value={tenders.length}
          href="/tender"
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Purchase Orders"
          value={purchaseOrders.length}
          href="/orders/purchase"
        />
        <StatCard
          icon={<Truck className="w-5 h-5" />}
          label="Delivery Challans"
          value={deliveryChallans.length}
          href="/delivery"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Pending Payments"
          value={pendingPayments}
          href="/finance/payments"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Sales Orders</h3>
            <Link to="/orders/sales">
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {salesOrders.slice(-5).reverse().map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">{order.hospitalName}</p>
                  <p className="text-xs text-muted-foreground">{order.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatCurrency(order.saleTotal)}</p>
                  <p className={`text-xs ${order.paymentStatus === 'Cleared' ? 'text-green-600' : 'text-amber-600'}`}>
                    {order.paymentStatus}
                  </p>
                </div>
              </div>
            ))}
            {salesOrders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No sales orders yet</p>
            )}
          </div>
        </Card>

        {/* Recent Expenses */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Expenses</h3>
            <Link to="/finance/expenses">
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {dailyExpenses.slice(-5).reverse().map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">{expense.voucherNo}</p>
                  <p className="text-xs text-muted-foreground">{expense.payTo}</p>
                </div>
                <p className="font-medium text-sm">{formatCurrency(expense.totalAmount)}</p>
              </div>
            ))}
            {dailyExpenses.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No expenses recorded yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/tender">
            <Button variant="outline" className="w-full gap-2 justify-start">
              <Pill className="w-4 h-4" />
              <span className="hidden sm:inline">New Tender</span>
              <span className="sm:hidden">Tender</span>
            </Button>
          </Link>
          <Link to="/orders/purchase">
            <Button variant="outline" className="w-full gap-2 justify-start">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Purchase Order</span>
              <span className="sm:hidden">PO</span>
            </Button>
          </Link>
          <Link to="/delivery">
            <Button variant="outline" className="w-full gap-2 justify-start">
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">Delivery Challan</span>
              <span className="sm:hidden">DC</span>
            </Button>
          </Link>
          <Link to="/finance/expenses">
            <Button variant="outline" className="w-full gap-2 justify-start">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Expense</span>
              <span className="sm:hidden">Exp</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Info Section */}
      <Card className="p-6 border-border bg-card">
        <h3 className="text-lg font-semibold mb-3">About This System</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Ideal Distributor Management System is a comprehensive solution for pharmaceutical distribution management.
          Track tenders, manage purchase and sales orders, handle deliveries, manage expenses, and generate detailed reports
          all in one platform.
        </p>
      </Card>
    </div>
  );
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function KPICard({ icon, label, value, color }: KPICardProps) {
  return (
    <Card className="p-6 relative overflow-hidden" interactive>
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-full -mr-12 -mt-12`} />
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-lg ${color} bg-opacity-10 flex items-center justify-center mb-3`}>
          <div className={`${color} bg-opacity-20 text-white`}>{icon}</div>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}

function StatCard({ icon, label, value, href }: StatCardProps) {
  return (
    <Link to={href}>
      <Card
        className="p-4 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200"
        interactive
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
