import React from 'react';
import { useSummary, useOperationalAlerts } from '@/hooks/dashboard';
import { KpiTile, KpiTileSkeleton } from '../components/ui/KpiTile';
import { DashboardSection } from '../components/ui/DashboardSection';
import { Truck, ClipboardList, Package, FileText } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export const OperationsPipelineSection: React.FC = () => {
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: alerts, isLoading: alertsLoading } = useOperationalAlerts();

  if (summaryLoading || alertsLoading) {
    return (
      <DashboardSection title="Operations Pipeline" delay={0.2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <KpiTileSkeleton key={i} />)}
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection 
      title="Operations Pipeline" 
      description="Active orders and inventory status"
      delay={0.2}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          title="Supply Orders"
          value={formatNumber(summary?.pendingSupplyOrders || 0)}
          subValue={`${alerts?.unfulfilledOrPartialSupplyOrderCount || 0} unfulfilled/partial`}
          icon={Truck}
          colorClassName="text-orange-600"
          href="/supply-orders?status=pending"
        />
        <KpiTile
          title="Purchase Orders"
          value={formatNumber(summary?.pendingPurchaseOrders || 0)}
          subValue={`${alerts?.pendingOrSentPurchaseOrderCount || 0} pending/sent`}
          icon={ClipboardList}
          colorClassName="text-indigo-600"
          href="/orders/purchase?status=pending"
        />
        <KpiTile
          title="Low Stock"
          value={formatNumber(summary?.lowStockProducts || 0)}
          subValue="Below reorder level"
          icon={Package}
          colorClassName={summary?.lowStockProducts ? "text-red-600" : "text-green-600"}
          href="/inventory?filter=low-stock"
        />
        <KpiTile
          title="Total Payables"
          value={formatNumber(alerts?.purchaseOrdersWithPayableBalance || 0)}
          subValue="POs with balance"
          icon={FileText}
          colorClassName="text-slate-600"
          href="/finance/payments"
        />
      </div>
    </DashboardSection>
  );
};
