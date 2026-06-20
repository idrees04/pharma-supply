import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
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

  // Explicitly type the variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-8 pb-8 pr-2"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Dashboard Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Dashboard
          </h1>
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
      </motion.div>

      {/* Zone 1: Vital Stats & Risks */}
      <motion.div variants={itemVariants}>
        <LiquidityRiskSection />
      </motion.div>

      {/* Zone 2: Operational Pipeline */}
      <motion.div variants={itemVariants}>
        <OperationsPipelineSection />
      </motion.div>

      {/* Zone 3: Market & Performance - Equal heights */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 min-h-[400px] hover:shadow-lg transition-shadow duration-300 rounded-xl">
          <MonthlySalesChart />
        </div>
        <div className="min-h-[400px] hover:shadow-lg transition-shadow duration-300 rounded-xl">
          <TopProducts />
        </div>
      </motion.div>

      {/* Zone 4: Exception Details - Equal heights */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="min-h-[400px] hover:shadow-lg transition-shadow duration-300 rounded-xl">
          <LowStockTable />
        </div>
        <div className="min-h-[400px] hover:shadow-lg transition-shadow duration-300 rounded-xl">
          <PendingPaymentsTable />
        </div>
      </motion.div>

      {/* Zone 5: Master Data Snapshot */}
      <motion.div variants={itemVariants}>
        <NetworkSnapshotSection />
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;