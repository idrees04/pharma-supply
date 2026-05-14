import React from 'react';
import { useSummary, useOperationalAlerts } from '@/hooks/dashboard';
import { KpiTile, KpiTileSkeleton } from '../components/ui/KpiTile';
import { DashboardSection } from '../components/ui/DashboardSection';
import { Wallet, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export const LiquidityRiskSection: React.FC = () => {
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: alerts, isLoading: alertsLoading } = useOperationalAlerts();

  if (summaryLoading || alertsLoading) {
    return (
      <DashboardSection title="Liquidity & Risk" delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <KpiTileSkeleton key={i} />)}
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection 
      title="Liquidity & Risk" 
      description="Real-time cash position and collection risk"
      delay={0.1}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          title="Cash Balance"
          value={formatCurrency(summary?.totalCashBalance)}
          icon={Wallet}
          colorClassName="text-emerald-600"
          href="/finance/accounts"
        />
        <KpiTile
          title="Bank Balance"
          value={formatCurrency(summary?.totalBankBalance)}
          icon={CreditCard}
          colorClassName="text-blue-600"
          href="/finance/accounts"
        />
        <KpiTile
          title="Total Receivables"
          value={formatCurrency(summary?.outstandingReceivables)}
          subValue={`${alerts?.invoicesWithReceivableBalance || 0} active invoices`}
          icon={TrendingUp}
          colorClassName="text-amber-600"
          href="/invoices?hasBalance=true"
        />
        <KpiTile
          title="Overdue Receivables"
          value={formatNumber(alerts?.invoicesWithReceivableOverdue || 0)}
          subValue={alerts?.invoicesWithReceivableOverdue ? "Immediate action required" : "No overdue invoices"}
          icon={AlertTriangle}
          colorClassName={alerts?.invoicesWithReceivableOverdue ? "text-red-600" : "text-green-600"}
          href="/invoices?status=overdue"
        />
      </div>
    </DashboardSection>
  );
};
