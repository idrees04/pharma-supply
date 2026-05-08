import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { SupplyOrder } from '@/types/api/supplyOrders';
import { DeliveryChallanFromSupplyOrderPanel } from './DeliveryChallanFromSupplyOrderPanel';
import { InvoiceCreationPanel } from './InvoiceCreationPanel';

interface SupplyOrderFulfillmentFlowProps {
  supplyOrderId: number;
  supplyOrder: SupplyOrder;
  refetchSupplyOrder: () => Promise<unknown>;
  onComplete?: () => void;
  onCancel?: () => void;
}

function StepChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 text-xs font-bold transition-colors',
        active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'
      )}
    >
      {label}
    </span>
  );
}

/**
 * Guided flow: POST delivery challan on the supply order, then POST invoice from supply order
 * (invoice links to the challan created in step 1).
 */
export function SupplyOrderFulfillmentFlow({
  supplyOrderId,
  supplyOrder,
  refetchSupplyOrder,
  onComplete,
  onCancel,
}: SupplyOrderFulfillmentFlowProps) {
  const [step, setStep] = useState<'challan' | 'invoice'>('challan');
  const [linkedChallanId, setLinkedChallanId] = useState<number | null>(null);

  const handleChallanCreated = async (deliveryChallanId: number) => {
    await refetchSupplyOrder();
    setLinkedChallanId(deliveryChallanId);
    setStep('invoice');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3">
        <StepChip label="1 · Delivery challan" active={step === 'challan'} />
        <span className="text-muted-foreground">→</span>
        <StepChip label="2 · Invoice" active={step === 'invoice'} />
      </div>

      {step === 'challan' && (
        <DeliveryChallanFromSupplyOrderPanel
          supplyOrderId={supplyOrderId}
          supplyOrder={supplyOrder}
          onCreated={handleChallanCreated}
          onCancel={onCancel}
        />
      )}

      {step === 'invoice' && (
        <InvoiceCreationPanel
          supplyOrderId={supplyOrderId}
          supplyOrder={supplyOrder}
          initialDeliveryChallanId={linkedChallanId ?? undefined}
          lockDeliveryChallanSelection={Boolean(linkedChallanId)}
          onSuccess={onComplete}
          onClose={onCancel}
        />
      )}
    </div>
  );
}
