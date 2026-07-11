import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getLifecycleSteps,
  getSupplyOrderStatusClassName,
  getSupplyOrderStatusIcon,
  getSupplyOrderStatusLabel,
} from '@/lib/supplyOrderStatusDisplay';
import { SupplyOrderStatus, type SupplyOrderStatusOption } from '@/types/api/supplyOrders';

interface SupplyOrderLifecycleStepperProps {
  currentStatus: number;
  statuses: SupplyOrderStatusOption[];
  isLoading?: boolean;
}

export function SupplyOrderLifecycleStepper({
  currentStatus,
  statuses,
  isLoading = false,
}: SupplyOrderLifecycleStepperProps) {
  const steps = useMemo(() => getLifecycleSteps(statuses), [statuses]);
  const isCancelled = currentStatus === SupplyOrderStatus.Cancelled;

  if (isLoading) {
    return (
      <Card className="border shadow-xl shadow-slate-200/50 bg-card overflow-hidden rounded-3xl">
        <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading order status…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-xl shadow-slate-200/50 bg-card overflow-hidden rounded-3xl">
      <CardHeader className="bg-slate-50/80 border-b py-4 flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Order Status
        </CardTitle>
        {isCancelled && (
          <Badge className={cn('font-bold', getSupplyOrderStatusClassName(SupplyOrderStatus.Cancelled))}>
            {getSupplyOrderStatusLabel(SupplyOrderStatus.Cancelled, statuses)}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="grid overflow-x-auto no-scrollbar"
          style={{ gridTemplateColumns: `repeat(${Math.max(steps.length, 1)}, minmax(0, 1fr))` }}
        >
          {steps.map((step) => {
            const isCurrent = !isCancelled && currentStatus === step.value;
            const isDone = !isCancelled && currentStatus > step.value;
            const Icon = getSupplyOrderStatusIcon(step.value, step.code);
            const colorClass = isCurrent
              ? 'text-primary'
              : isDone
                ? 'text-emerald-600'
                : 'text-slate-400';
            const bgClass = isCurrent
              ? 'bg-primary/5'
              : isDone
                ? 'bg-emerald-50/30'
                : 'bg-transparent';

            return (
              <div
                key={step.value}
                className={cn(
                  'flex flex-col items-center gap-3 p-5 min-w-[120px] border-r border-slate-100 last:border-0 transition-all relative',
                  bgClass
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500 shadow-sm',
                    isCurrent
                      ? 'bg-white border-current scale-110 z-10 shadow-lg'
                      : isDone
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50/50 border-slate-100'
                  )}
                >
                  <Icon className={cn('h-5 w-5', colorClass)} />
                </div>
                <div className="flex flex-col items-center text-center">
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-widest leading-none mb-1',
                      colorClass
                    )}
                  >
                    {getSupplyOrderStatusLabel(step.value, statuses)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-tight">
                    {isCurrent ? 'Current' : isDone ? 'Complete' : 'Upcoming'}
                  </span>
                </div>
                {isCurrent && (
                  <motion.div
                    layoutId="so-active-indicator"
                    className="absolute bottom-0 left-0 h-1 w-full bg-primary"
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
