import React from 'react';
import { useDashboardData } from '@/hooks/dashboard';
import SummaryCards from './components/SummaryCards';
import MonthlySalesChart from './components/MonthlySalesChart';
import TopProducts from './components/TopProducts';
import LowStockTable from './components/LowStockTable';
import PendingPaymentsTable from './components/PendingPayments';
import OperationalAlerts from './components/OperationalAlerts';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardPage: React.FC = () => {
  const { isLoading, isError, error, refetch } = useDashboardData();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-lg text-gray-700">Failed to load dashboard data.</p>
        <p className="text-sm text-gray-500">{error?.message}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 space-y-6"
    >
      {/* Summary Cards - responsive grid (will wrap to 4 per row on large screens) */}
      <SummaryCards />

      {/* First row: Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlySalesChart />
        </div>
        <div>
          <TopProducts />
        </div>
      </div>

      {/* Second row: Low Stock + Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockTable />
        <PendingPaymentsTable />
      </div>

      {/* Third row: Operational Alerts */}
      <OperationalAlerts />
    </motion.div>
  );
};

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl" />
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 rounded-xl" />
        <div className="h-80 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );
};

export default DashboardPage;