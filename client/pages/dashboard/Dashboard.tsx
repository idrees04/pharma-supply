import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Sections
import { LiquidityRiskSection } from './sections/LiquidityRiskSection';
import { OperationsPipelineSection } from './sections/OperationsPipelineSection';
import { NetworkSnapshotSection } from './sections/NetworkSnapshotSection';

// Components
import MonthlySalesChart from './components/MonthlySalesChart';
import TopProducts from './components/TopProducts';
import LowStockTable from './components/LowStockTable';
import PendingPaymentsTable from './components/PendingPayments';

const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['dashboard'] });
    setIsRefreshing(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Operational Overview</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-fit"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Zone 1: Vital Stats & Risks (Liquidity + Top Exceptions) */}
      <LiquidityRiskSection />

      {/* Zone 2: Operational Pipeline */}
      <OperationsPipelineSection />

      {/* Zone 3: Market & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlySalesChart />
        </div>
        <div className="h-full">
          <TopProducts />
        </div>
      </div>

      {/* Zone 4: Exception Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockTable />
        <PendingPaymentsTable />
      </div>

      {/* Zone 5: Master Data Snapshot */}
      <NetworkSnapshotSection />
    </div>
  );
};

export default DashboardPage;