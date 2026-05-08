import React from 'react';
import { useSummary } from '@/hooks/dashboard';
import { KpiTile, KpiTileSkeleton } from '../components/ui/KpiTile';
import { DashboardSection } from '../components/ui/DashboardSection';
import { Building2, Users, Pill } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export const NetworkSnapshotSection: React.FC = () => {
  const { data: summary, isLoading } = useSummary();

  if (isLoading) {
    return (
      <DashboardSection title="Network Snapshot" delay={0.5}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <KpiTileSkeleton key={i} />)}
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection 
      title="Network Snapshot" 
      description="Overview of your distribution network"
      delay={0.5}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiTile
          title="Total Hospitals"
          value={formatNumber(summary?.totalHospitals || 0)}
          subValue={`${summary?.activeHospitals || 0} active customers`}
          icon={Building2}
          colorClassName="text-sky-600"
          href="/hospitals"
        />
        <KpiTile
          title="Total Suppliers"
          value={formatNumber(summary?.totalSuppliers || 0)}
          subValue={`${summary?.activeSuppliers || 0} active partners`}
          icon={Users}
          colorClassName="text-teal-600"
          href="/suppliers"
        />
        <KpiTile
          title="Total Products"
          value={formatNumber(summary?.totalProducts || 0)}
          subValue="In catalog"
          icon={Pill}
          colorClassName="text-purple-600"
          href="/inventory/products"
        />
      </div>
    </DashboardSection>
  );
};
